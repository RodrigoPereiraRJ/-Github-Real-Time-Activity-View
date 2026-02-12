package com.githubmonitor.api.service.impl;

import com.githubmonitor.api.service.NotificationService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import java.awt.*;

@Service
public class WindowsNotificationServiceImpl implements NotificationService {

    private SystemTray tray;
    private TrayIcon trayIcon;

    @PostConstruct
    public void init() {
        // Safe check for OS to prevent errors on Linux/Server environments (Render)
        String os = System.getProperty("os.name").toLowerCase();
        if (!os.contains("win")) {
            System.out.println("Non-Windows OS detected (" + os + "). Notifications will only be logged to console.");
            return;
        }

        try {
            // Extra safety check for Headless mode
            if (GraphicsEnvironment.isHeadless()) {
                 System.out.println("Headless mode detected. Notifications will only be logged to console.");
                 return;
            }

            if (!SystemTray.isSupported()) {
                System.err.println("SystemTray is not supported. Notifications will only be logged.");
                return;
            }
            
            tray = SystemTray.getSystemTray();
            
            // Create a simple icon programmatically to avoid file dependency
            Image image = createDefaultIcon();
            
            trayIcon = new TrayIcon(image, "Github Monitor");
            trayIcon.setImageAutoSize(true);
            trayIcon.setToolTip("Github Monitor Running");
            tray.add(trayIcon);
            System.out.println("Windows Notification Service initialized successfully.");
        } catch (Throwable e) {
             // Catch Throwable to ensure application startup never fails due to notification service
             System.err.println("Error initializing Notification Service (Safe Fallback): " + e.getMessage());
        }
    }

    private Image createDefaultIcon() {
        int width = 16;
        int height = 16;
        java.awt.image.BufferedImage image = new java.awt.image.BufferedImage(width, height, java.awt.image.BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2 = image.createGraphics();
        g2.setColor(Color.BLUE);
        g2.fillOval(0, 0, width, height);
        g2.setColor(Color.WHITE);
        g2.setFont(new Font("Arial", Font.BOLD, 10));
        g2.drawString("G", 4, 12);
        g2.dispose();
        return image;
    }

    @Override
    public void sendNotification(String title, String message) {
        if (trayIcon != null) {
            trayIcon.displayMessage(title, message, TrayIcon.MessageType.INFO);
        } else {
            // Fallback to console log if tray is not supported
            System.out.println(">>> NOTIFICATION [" + title + "]: " + message);
        }
    }
}
