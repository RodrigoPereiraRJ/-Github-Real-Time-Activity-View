package com.githubmonitor.api.service.impl;

import com.githubmonitor.api.dto.AlertDTO;
import com.githubmonitor.api.dto.EventDTO;
import com.githubmonitor.api.dto.RepositoryDTO;
import com.githubmonitor.api.service.AlertService;
import com.githubmonitor.api.service.DashboardService;
import com.githubmonitor.api.service.EventService;
import com.githubmonitor.api.service.RepositoryService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final RepositoryService repositoryService;
    private final EventService eventService;
    private final AlertService alertService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yy HH:mm:ss");

    @Override
    public byte[] generateExcelReport() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            // Styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle dateStyle = createDataStyle(workbook); // Currently same as data style, but can be customized

            // 1. Overview Sheet
            createOverviewSheet(workbook, headerStyle, dataStyle);

            // 2. Repositories Sheet
            createRepositoriesSheet(workbook, headerStyle, dataStyle);

            // 3. Events Sheet (Last 1000)
            createEventsSheet(workbook, headerStyle, dataStyle);

            // 4. Alerts Sheet
            createAlertsSheet(workbook, headerStyle, dataStyle);

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate Excel report", e);
        }
    }

    private void createOverviewSheet(Workbook workbook, CellStyle headerStyle, CellStyle dataStyle) {
        Sheet sheet = workbook.createSheet("Overview");
        Row header = sheet.createRow(0);
        
        createCell(header, 0, "Metric", headerStyle);
        createCell(header, 1, "Value", headerStyle);

        // Fetch counts (fetching first page to get totalElements)
        Pageable pageable = PageRequest.of(0, 1);
        long totalRepos = repositoryService.findAll(pageable).getTotalElements();
        long totalEvents = eventService.findAll(null, null, null, null, pageable).getTotalElements();
        long totalAlerts = alertService.findAll(null, pageable).getTotalElements();

        int rowIdx = 1;
        Row r1 = sheet.createRow(rowIdx++);
        createCell(r1, 0, "Total Repositories", dataStyle);
        createCell(r1, 1, totalRepos, dataStyle);

        Row r2 = sheet.createRow(rowIdx++);
        createCell(r2, 0, "Total Events Recorded", dataStyle);
        createCell(r2, 1, totalEvents, dataStyle);

        Row r3 = sheet.createRow(rowIdx++);
        createCell(r3, 0, "Total Alerts", dataStyle);
        createCell(r3, 1, totalAlerts, dataStyle);

        Row r4 = sheet.createRow(rowIdx++);
        createCell(r4, 0, "Generated At", dataStyle);
        createCell(r4, 1, java.time.LocalDateTime.now().format(DATE_FORMATTER), dataStyle);
    }

    private void createRepositoriesSheet(Workbook workbook, CellStyle headerStyle, CellStyle dataStyle) {
        Sheet sheet = workbook.createSheet("Repositories");
        String[] headers = {"ID", "Name", "Owner", "Language", "Status", "Last Synced"};
        
        createHeaderRow(sheet, headers, headerStyle);

        // Fetch all repositories (up to 1000 for report)
        Page<RepositoryDTO> repos = repositoryService.findAll(PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "lastSyncedAt")));
        
        int rowIdx = 1;
        for (RepositoryDTO repo : repos.getContent()) {
            Row row = sheet.createRow(rowIdx++);
            createCell(row, 0, repo.getId() != null ? repo.getId().toString() : "", dataStyle);
            createCell(row, 1, repo.getName() != null ? repo.getName() : "N/A", dataStyle);
            createCell(row, 2, repo.getOwner() != null ? repo.getOwner() : "N/A", dataStyle);
            createCell(row, 3, repo.getLanguage() != null ? repo.getLanguage() : "N/A", dataStyle);
            createCell(row, 4, repo.getStatus() != null ? repo.getStatus().toString() : "UNKNOWN", dataStyle);
            
            if (repo.getLastSyncedAt() != null) {
                createCell(row, 5, repo.getLastSyncedAt().format(DATE_FORMATTER), dataStyle);
            } else {
                createCell(row, 5, "-", dataStyle);
            }
        }
    }

    private void createEventsSheet(Workbook workbook, CellStyle headerStyle, CellStyle dataStyle) {
        Sheet sheet = workbook.createSheet("Recent Events");
        String[] headers = {"ID", "Type", "User", "Branch", "Repository ID", "Date"};
        
        createHeaderRow(sheet, headers, headerStyle);

        // Define conditional styles for Event Types (Using Pastel RGB Colors)
        CellStyle pushStyle = createRGBStyle(workbook, new byte[]{(byte)220, (byte)240, (byte)255});   // Pastel Blue
        CellStyle prStyle = createRGBStyle(workbook, new byte[]{(byte)240, (byte)230, (byte)250});     // Pastel Purple
        CellStyle issueStyle = createRGBStyle(workbook, new byte[]{(byte)255, (byte)245, (byte)230});  // Pastel Orange
        CellStyle releaseStyle = createRGBStyle(workbook, new byte[]{(byte)230, (byte)255, (byte)230});// Pastel Green
        CellStyle defaultStyle = dataStyle;

        Page<EventDTO> events = eventService.findAll(null, null, null, null, PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "createdAt")));
        
        int rowIdx = 1;
        for (EventDTO event : events.getContent()) {
            Row row = sheet.createRow(rowIdx++);
            
            // Determine style based on Event Type
            CellStyle rowStyle = defaultStyle;
            if (event.getType() != null) {
                switch (event.getType()) {
                    case PUSH: rowStyle = pushStyle; break;
                    case PULL_REQUEST: rowStyle = prStyle; break;
                    case ISSUE: rowStyle = issueStyle; break;
                    case RELEASE: rowStyle = releaseStyle; break;
                    default: rowStyle = defaultStyle; break;
                }
            }

            createCell(row, 0, event.getId() != null ? event.getId().toString() : "", rowStyle);
            createCell(row, 1, event.getType() != null ? event.getType().toString() : "UNKNOWN", rowStyle);
            createCell(row, 2, event.getActor() != null ? event.getActor() : "N/A", rowStyle);
            createCell(row, 3, event.getBranch() != null ? event.getBranch() : "N/A", rowStyle);
            createCell(row, 4, event.getRepositoryId() != null ? event.getRepositoryId().toString() : "", rowStyle);
            
            if (event.getCreatedAt() != null) {
                createCell(row, 5, event.getCreatedAt().format(DATE_FORMATTER), rowStyle);
            }
        };
    }

    private void createAlertsSheet(Workbook workbook, CellStyle headerStyle, CellStyle dataStyle) {
        Sheet sheet = workbook.createSheet("Alerts");
        String[] headers = {"ID", "Severity", "Rule", "User", "Branch", "Message", "Status", "Created At"};
        
        createHeaderRow(sheet, headers, headerStyle);

        // Define conditional styles for Alert Status
        CellStyle openStyle = createColoredStyle(workbook, IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex()); // Using a reddish tone might be better but standard palette is limited, using Blue/Green logic
        // Let's use Red for Open/Critical logic if possible, or simple Status mapping
        CellStyle statusOpenStyle = createColoredStyle(workbook, IndexedColors.ROSE.getIndex());
        CellStyle statusResolvedStyle = createColoredStyle(workbook, IndexedColors.LIGHT_GREEN.getIndex());

        Page<AlertDTO> alerts = alertService.findAll(null, PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "createdAt")));
        
        int rowIdx = 1;
        for (AlertDTO alert : alerts.getContent()) {
            Row row = sheet.createRow(rowIdx++);
            
            // Determine style based on Alert Status
            CellStyle rowStyle = dataStyle;
            if (alert.getStatus() != null) {
                switch (alert.getStatus()) {
                    case OPEN: rowStyle = statusOpenStyle; break;
                    case RESOLVED: rowStyle = statusResolvedStyle; break;
                    default: rowStyle = dataStyle; break;
                }
            }

            createCell(row, 0, alert.getId() != null ? alert.getId().toString() : "", rowStyle);
            createCell(row, 1, alert.getSeverity() != null ? alert.getSeverity().toString() : "", rowStyle);
            createCell(row, 2, alert.getRuleType() != null ? alert.getRuleType() : "N/A", rowStyle);
            createCell(row, 3, alert.getAuthorLogin() != null ? alert.getAuthorLogin() : "N/A", rowStyle);
            createCell(row, 4, alert.getBranch() != null ? alert.getBranch() : "N/A", rowStyle);
            createCell(row, 5, alert.getMessage() != null ? alert.getMessage() : "", rowStyle);
            createCell(row, 6, alert.getStatus() != null ? alert.getStatus().toString() : "", rowStyle);
            
            if (alert.getCreatedAt() != null) {
                createCell(row, 7, alert.getCreatedAt().format(DATE_FORMATTER), rowStyle);
            }
        }
    }

    // Helper Methods
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);
        
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        return style;
    }

    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createColoredStyle(Workbook workbook, short colorIndex) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setFillForegroundColor(colorIndex);
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private CellStyle createRGBStyle(Workbook workbook, byte[] rgb) {
        XSSFWorkbook xssfWorkbook = (XSSFWorkbook) workbook;
        XSSFCellStyle style = xssfWorkbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        style.setFillForegroundColor(new XSSFColor(rgb, null));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private void createHeaderRow(Sheet sheet, String[] headers, CellStyle style) {
        Row row = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            createCell(row, i, headers[i], style);
        }
    }

    private void createCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        if (style != null) cell.setCellStyle(style);
    }

    private void createCell(Row row, int col, long value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        if (style != null) cell.setCellStyle(style);
    }

}
