package com.abb.adaptive.controller;

import com.abb.adaptive.model.AnalysisResponse;
import com.abb.adaptive.service.AnalysisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UploadController {

    private final AnalysisService analysisService;

    /**
     * Health check endpoint.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Adaptive DS Assistant Backend"
        ));
    }

    /**
     * Upload a CSV file and trigger ML analysis.
     * POST /api/upload
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadAndAnalyze(
            @RequestParam("file") MultipartFile file) {

        log.info("Received upload request: filename={}, size={}B",
                file.getOriginalFilename(), file.getSize());

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Uploaded file is empty. Please select a valid CSV file."));
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".csv")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid file type. Only CSV files are supported."));
        }

        try {
            AnalysisResponse response = analysisService.analyzeDataset(file);
            if (response.getError() != null) {
                return ResponseEntity.badRequest().body(Map.of("error", response.getError()));
            }
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("IO error reading file: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to read uploaded file: " + e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Runtime error during analysis: {}", e.getMessage());
            return ResponseEntity.status(503)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
