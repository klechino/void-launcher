package com.nox.client;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.network.ClientPlayerEntity;

import java.util.LinkedHashMap;
import java.util.Map;

public final class NoxModules {
    private final Map<String, NoxModule> modules = new LinkedHashMap<>();
    private double savedGamma = 1.0D;

    public NoxModules() {
        add("flight", "Test Flight", "Movement");
        add("sprint", "Sprint", "Movement");
        add("fullbright", "Fullbright", "Visual");
        add("fps", "FPS", "HUD");
        add("coords", "Coordinates", "HUD");
        add("keystrokes", "Keystrokes", "HUD");
        add("arraylist", "ArrayList", "HUD");
    }

    private void add(String id, String name, String category) {
        modules.put(id, new NoxModule(id, name, category));
    }

    public Map<String, NoxModule> all() { return modules; }
    public NoxModule get(String id) { return modules.get(id); }

    public void toggle(String id) {
        NoxModule module = modules.get(id);
        if (module != null) set(id, !module.enabled());
    }

    public void set(String id, boolean enabled) {
        NoxModule module = modules.get(id);
        if (module == null) return;

        MinecraftClient client = MinecraftClient.getInstance();

        if (enabled && id.equals("flight") && !client.isInSingleplayer()) {
            module.enabled(false);
            return;
        }

        if (id.equals("fullbright")) {
            double current = client.options.getGamma().getValue().doubleValue();
            if (enabled) {
                savedGamma = current;
                client.options.getGamma().setValue(10.0D);
            } else {
                client.options.getGamma().setValue(savedGamma);
            }
        }

        if (id.equals("flight") && client.player != null) {
            if (enabled) {
                client.player.getAbilities().allowFlying = true;
                client.player.getAbilities().flying = true;
            } else {
                client.player.getAbilities().flying = false;
                client.player.getAbilities().allowFlying = false;
            }
        }

        module.enabled(enabled);
    }

    public void tick(MinecraftClient client) {
        ClientPlayerEntity player = client.player;
        if (player == null) return;

        if (get("flight").enabled()) {
            if (!client.isInSingleplayer()) {
                set("flight", false);
            } else {
                player.getAbilities().allowFlying = true;
                player.getAbilities().flying = true;
            }
        }

        if (get("sprint").enabled() && player.forwardSpeed > 0.0F) {
            player.setSprinting(true);
        }
    }

    public void restore() {
        setAllDisabled();
    }

    private void setAllDisabled() {
        for (NoxModule module : modules.values()) module.enabled(false);
    }
}
