package com.abb.adaptive.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AnalysisResponse {

    private String problemType;
    private String targetColumn;
    private String recommendedModel;
    private Double accuracy;

    private DatasetSummary datasetSummary;
    private List<Map<String, Object>> featureImportance;
    private List<Map<String, Object>> modelComparison;
    private List<String> insights;

    private Integer optimalClusters;
    private List<Map<String, Object>> clusterChart;
    private List<Map<String, Object>> trendData;
    private List<Map<String, Object>> distributionChart;
    private List<Map<String, Object>> classDistribution;

    private String error;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DatasetSummary {
        private Integer rows;
        private Integer columns;
        private Integer missingValues;
        private List<String> columnNames;
        private Map<String, String> dtypes;
        private List<String> numericColumns;
        private List<String> categoricalColumns;
        private List<Map<String, Object>> sampleData;
        private Map<String, Object> statistics;
    }
}
