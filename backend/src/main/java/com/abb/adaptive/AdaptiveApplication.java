package com.abb.adaptive;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AdaptiveApplication {
    public static void main(String[] args) {
        SpringApplication.run(AdaptiveApplication.class, args);
        System.out.println("🚀 Adaptive DS Assistant Backend running on http://localhost:8080");
    }
}
