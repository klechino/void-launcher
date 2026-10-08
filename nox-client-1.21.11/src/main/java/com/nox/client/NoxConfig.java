package com.nox.client;

import net.fabricmc.loader.api.FabricLoader;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class NoxConfig {
    private static final Pattern ENTRY = Pattern.compile("\\"([a-z0-9_]+)\\"\\s*:\\s*(true|false)");
    private final Path path = FabricLoader.getInstance().getConfigDir().resolve("nox-client.json");

    public void save() {
        try {
            StringBuilder out = new StringBuilder("{\\n");
            boolean first = true;
            for (NoxModule module : NoxClient.MODULES.all().values()) {
                if (!first) out.append(",\\n");
                first = false;
                out.append("  \\"").append(module.id()).append("\\": ").append(module.enabled());
            }
            out.append("\\n}\\n");
            Files.writeString(path, out.toString(), StandardCharsets.UTF_8);
        } catch (IOException ignored) {
        }
    }

    public void load() {
        if (!Files.exists(path)) return;
        try {
            String text = Files.readString(path, StandardCharsets.UTF_8);
            Matcher matcher = ENTRY.matcher(text);
            while (matcher.find()) {
                NoxModule module = NoxClient.MODULES.get(matcher.group(1));
                if (module != null) {
                    NoxClient.MODULES.set(module.id(), Boolean.parseBoolean(matcher.group(2)));
                }
            }
        } catch (IOException ignored) {
        }
    }
}
