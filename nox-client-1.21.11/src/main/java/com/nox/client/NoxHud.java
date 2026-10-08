package com.nox.client;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.font.TextRenderer;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.network.ClientPlayerEntity;

public final class NoxHud {
    private NoxHud() {}

    public static void render(DrawContext context) {
        MinecraftClient client = MinecraftClient.getInstance();
        ClientPlayerEntity player = client.player;
        if (player == null || client.getDebugHud().shouldShowDebugHud()) return;

        TextRenderer tr = client.textRenderer;
        int x = 10;
        int y = 10;
        int purple = 0xFFB15CFF;
        int white = 0xFFFFFFFF;

        context.fill(x - 6, y - 6, x + 102, y + 13, 0xD0100B18);
        context.drawTextWithShadow(tr, "NØX CLIENT", x, y - 1, purple);

        int row = y + 19;
        if (NoxClient.MODULES.get("fps").enabled()) {
            context.drawTextWithShadow(tr, "FPS " + client.getCurrentFps(), x, row, white);
            row += 12;
        }
        if (NoxClient.MODULES.get("coords").enabled()) {
            context.drawTextWithShadow(tr,
                    String.format("XYZ %.1f %.1f %.1f", player.getX(), player.getY(), player.getZ()),
                    x, row, white);
            row += 12;
        }
        if (NoxClient.MODULES.get("keystrokes").enabled()) {
            context.drawTextWithShadow(tr, "W A S D", x, row, 0xFFB9C2D0);
        }

        if (NoxClient.MODULES.get("arraylist").enabled()) {
            int right = client.getWindow().getScaledWidth() - 10;
            int yy = 10;
            for (NoxModule module : NoxClient.MODULES.all().values()) {
                if (!module.enabled()) continue;
                if (module.category().equals("HUD")) continue;
                String label = module.name();
                int w = tr.getWidth(label);
                context.drawTextWithShadow(tr, label, right - w, yy, purple);
                yy += 12;
            }
        }
    }
}
