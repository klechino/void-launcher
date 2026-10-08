package com.nox.client;

import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.text.Text;

public final class NoxScreen extends Screen {
    private String category = "Movement";
    private long openedAt;

    public NoxScreen() {
        super(Text.literal("NØX CLIENT"));
    }

    @Override
    protected void init() {
        openedAt = System.nanoTime();
        clearChildren();

        String[] categories = {"Movement", "Visual", "HUD"};
        int catX = Math.max(20, width / 2 - 170);
        int catY = Math.max(28, height / 2 - 170);

        for (int i = 0; i < categories.length; i++) {
            final String cat = categories[i];
            addDrawableChild(ButtonWidget.builder(Text.literal(cat), button -> {
                category = cat;
                init();
            }).dimensions(catX + i * 115, catY, 105, 22).build());
        }

        int x = width / 2 - 105;
        int y = height / 2 - 125;
        for (NoxModule module : NoxClient.MODULES.all().values()) {
            if (!module.category().equals(category)) continue;
            NoxModule target = module;
            addDrawableChild(ButtonWidget.builder(label(target), button -> {
                NoxClient.toggle(target.id());
                button.setMessage(label(target));
            }).dimensions(x, y, 210, 28).build());
            y += 36;
        }

        addDrawableChild(ButtonWidget.builder(Text.literal("Close"), button -> close())
                .dimensions(width / 2 - 80, height - 45, 160, 24).build());
    }

    private static Text label(NoxModule module) {
        return Text.literal((module.enabled() ? "ON  " : "OFF ") + module.name());
    }

    @Override
    public void render(DrawContext context, int mouseX, int mouseY, float deltaTicks) {
        float t = Math.min(1.0f, (System.nanoTime() - openedAt) / 160_000_000f);
        int offset = (int) ((1.0f - t) * 18.0f);

        context.fill(0, 0, width, height, 0xB5000000);

        int left = width / 2 - 280;
        int top = height / 2 - 195 + offset;
        int right = width / 2 + 280;
        int bottom = height / 2 + 195 + offset;

        context.fill(left, top, right, bottom, 0xE8171226);
        context.fill(left + 1, top + 1, right - 1, top + 3, 0xFFB15CFF);
        context.drawCenteredTextWithShadow(textRenderer, "NØX CLIENT", width / 2, top + 18, 0xFFFFFFFF);
        context.drawCenteredTextWithShadow(textRenderer, "Fabric 1.21.11  •  Right Shift", width / 2, top + 35, 0xFF9A8FA8);

        super.render(context, mouseX, mouseY, deltaTicks);
    }

    @Override
    public boolean shouldPause() {
        return false;
    }
}
