package com.nox.client;

public final class NoxModule {
    private final String id;
    private final String name;
    private final String category;
    private boolean enabled;

    public NoxModule(String id, String name, String category) {
        this.id = id;
        this.name = name;
        this.category = category;
    }

    public String id() { return id; }
    public String name() { return name; }
    public String category() { return category; }
    public boolean enabled() { return enabled; }
    public void enabled(boolean enabled) { this.enabled = enabled; }
}
