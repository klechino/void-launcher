package com.nox.client;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.util.InputUtil;
import org.lwjgl.glfw.GLFW;

public final class NoxClient implements ClientModInitializer {
    public static final String MOD_ID = "nox";
    public static final NoxModules MODULES = new NoxModules();
    public static final NoxConfig CONFIG = new NoxConfig();
    public static KeyBinding OPEN_MENU;

    @Override
    public void onInitializeClient() {
        CONFIG.load();

        OPEN_MENU = KeyBindingHelper.registerKeyBinding(new KeyBinding(
                "key.nox.open_menu",
                InputUtil.Type.KEYSYM,
                GLFW.GLFW_KEY_RIGHT_SHIFT,
                "key.categories.nox"
        ));

        ClientTickEvents.END_CLIENT_TICK.register(NoxClient::tick);
        HudRenderCallback.EVENT.register((context, tickCounter) -> NoxHud.render(context));
    }

    private static void tick(MinecraftClient client) {
        while (OPEN_MENU.wasPressed()) {
            client.setScreen(new NoxScreen());
        }
        MODULES.tick(client);
    }

    public static void toggle(String id) {
        MODULES.toggle(id);
        CONFIG.save();
    }
}
