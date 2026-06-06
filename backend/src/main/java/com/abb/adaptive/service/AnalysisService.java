package com.abb.adaptive.service;

import com.abb.adaptive.model.AnalysisResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${flask.service.url}")
    private String flaskServiceUrl;

    public AnalysisResponse analyzeDataset(MultipartFile file) throws IOException {
        log.info("Forwarding file '{}' to Flask ML engine at {}", file.getOriginalFilename(), flaskServiceUrl);

        // Build multipart body to forward to Flask
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.csv";
            }
        };

        body.add("file", fileResource);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            @SuppressWarnings("null")
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    flaskServiceUrl + "/analyze",
                    HttpMethod.POST,
                    requestEntity,
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // Convert the raw map to AnalysisResponse
                String json = objectMapper.writeValueAsString(response.getBody());
                AnalysisResponse analysisResponse = objectMapper.readValue(json, AnalysisResponse.class);
                log.info("ML analysis complete. Problem type: {}, Model: {}",
                        analysisResponse.getProblemType(), analysisResponse.getRecommendedModel());
                return analysisResponse;
            } else {
                log.error("Flask service returned non-2xx: {}", response.getStatusCode());
                return AnalysisResponse.builder()
                        .error("ML service returned error: " + response.getStatusCode())
                        .build();
            }

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            log.error("Flask service returned HTTP error: {}", e.getResponseBodyAsString());
            try {
                // Try to parse the error message from Flask
                Map<String, Object> errorMap = objectMapper.readValue(e.getResponseBodyAsString(), new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                String errorMsg = errorMap.containsKey("error") ? errorMap.get("error").toString() : e.getStatusText();
                return AnalysisResponse.builder().error(errorMsg).build();
            } catch (Exception parseEx) {
                return AnalysisResponse.builder().error("ML service error: " + e.getStatusCode()).build();
            }
        } catch (RestClientException e) {
            log.error("Could not reach Flask ML engine: {}", e.getMessage());
            throw new RuntimeException("ML service unavailable. Please ensure the Python Flask service is running on port 5000.", e);
        }
    }
}
