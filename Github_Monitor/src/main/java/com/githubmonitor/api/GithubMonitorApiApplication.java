package com.githubmonitor.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GithubMonitorApiApplication {

    @jakarta.annotation.PostConstruct
    public void init() {
        java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("America/Sao_Paulo"));
    }

	public static void main(String[] args) {
        System.setProperty("java.awt.headless", "false");
        configureWindowsAppModelId();
		SpringApplication.run(GithubMonitorApiApplication.class, args);
	}

    private static void configureWindowsAppModelId() {
        if (System.getProperty("os.name").toLowerCase().contains("win")) {
            try {
                // Shell32.INSTANCE.SetCurrentProcessExplicitAppUserModelID expects a String directly in newer JNA versions,
                // or a WString in strict mappings. The error log indicated WString.
                com.sun.jna.platform.win32.Shell32.INSTANCE.SetCurrentProcessExplicitAppUserModelID(
                    new com.sun.jna.WString("GithubMonitor.Api")
                );
            } catch (Throwable e) {
                // Ignore if JNA is not available or fails
                System.err.println("Failed to set AppUserModelID: " + e.getMessage());
            }
        }
    }

}
