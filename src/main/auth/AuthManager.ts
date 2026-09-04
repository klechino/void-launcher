import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

const MICROSOFT_CLIENT_ID = '00000000402b5328';
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

export class AuthManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private minecraftToken: string | null = null;
  private profile: any = null;
  private tokenFile: string;

  constructor() {
    this.tokenFile = path.join(app.getPath('userData'), 'auth-tokens.json');
  }

  async login(): Promise<any> {
    try {
      // Step 1: Device code flow
      const deviceCodeResponse = await axios.post(
        'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode',
        {
          client_id: MICROSOFT_CLIENT_ID,
          scope: 'XboxLive.signin offline_access',
        }
      );

      const { device_code, user_code, verification_uri, expires_in, interval } = deviceCodeResponse.data;

      console.log(`Please visit ${verification_uri} and enter code: ${user_code}`);

      // Step 2: Poll for token
      const tokenResponse = await this.pollForToken(device_code, interval, expires_in);
      this.accessToken = tokenResponse.access_token;
      this.refreshToken = tokenResponse.refresh_token;

      // Step 3: Get Xbox token
      const xboxResponse = await axios.post('https://user.auth.xboxlive.com/user/authenticate', {
        Properties: {
          AuthMethod: 'OAuth',
          SiteName: 'user.auth.xboxlive.com',
          RpsTicket: `d=${this.accessToken}`,
        },
        RelyingParty: 'http://auth.xboxlive.com',
        TokenType: 'JWT',
      });

      const xboxToken = xboxResponse.data.Token;

      // Step 4: Get XSTS token
      const xstsResponse = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
        Properties: {
          SandboxId: 'RETAIL',
          UserTokens: [xboxToken],
        },
        RelyingParty: 'rp://api.minecraftservices.com/',
        TokenType: 'JWT',
      });

      const xstsToken = xstsResponse.data.Token;
      const userHash = xstsResponse.data.DisplayClaims.xui[0].uhs;

      // Step 5: Get Minecraft token
      const minecraftResponse = await axios.post('https://api.minecraftservices.com/authentication/login_with_xbox', {
        identityToken: `XBL3.0 x=${userHash};${xstsToken}`,
      });

      this.minecraftToken = minecraftResponse.data.access_token;

      // Step 6: Get profile
      const profileResponse = await axios.get('https://api.minecraftservices.com/minecraft/profile', {
        headers: {
          Authorization: `Bearer ${this.minecraftToken}`,
        },
      });

      this.profile = profileResponse.data;
      this.saveTokens();

      return { success: true, profile: this.profile };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async pollForToken(
    deviceCode: string,
    interval: number,
    expiresIn: number
  ): Promise<any> {
    const endTime = Date.now() + expiresIn * 1000;

    while (Date.now() < endTime) {
      try {
        const response = await axios.post(
          'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
          {
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            client_id: MICROSOFT_CLIENT_ID,
            device_code: deviceCode,
          },
          { validateStatus: () => true }
        );

        if (response.status === 200) {
          return response.data;
        }
      } catch (error) {
        // Continue polling
      }

      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
    }

    throw new Error('Device code expired');
  }

  async logout(): Promise<any> {
    this.accessToken = null;
    this.refreshToken = null;
    this.minecraftToken = null;
    this.profile = null;
    this.deleteTokenFile();
    return { success: true };
  }

  async getProfile(): Promise<any> {
    if (!this.minecraftToken) {
      return null;
    }

    try {
      const response = await axios.get('https://api.minecraftservices.com/minecraft/profile', {
        headers: {
          Authorization: `Bearer ${this.minecraftToken}`,
        },
      });

      this.profile = response.data;
      return this.profile;
    } catch (error) {
      console.error('Profile error:', error);
      return null;
    }
  }

  restoreAccount(): void {
    try {
      if (fs.existsSync(this.tokenFile)) {
        const data = JSON.parse(fs.readFileSync(this.tokenFile, 'utf-8'));
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.minecraftToken = data.minecraftToken;
        this.profile = data.profile;
      }
    } catch (error) {
      console.error('Failed to restore account:', error);
    }
  }

  private saveTokens(): void {
    const data = {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      minecraftToken: this.minecraftToken,
      profile: this.profile,
    };

    fs.writeFileSync(this.tokenFile, JSON.stringify(data), 'utf-8');
  }

  private deleteTokenFile(): void {
    try {
      if (fs.existsSync(this.tokenFile)) {
        fs.unlinkSync(this.tokenFile);
      }
    } catch (error) {
      console.error('Failed to delete token file:', error);
    }
  }
}
