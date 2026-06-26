package com.portalrpg;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class BackendApplication {

	public static void main(String[] args) {
		// Modo ingestão CLI (--ingest): não sobe o servidor web, só roda o IngestRunner.
		for (String a : args) {
			if (a.equals("--ingest") || a.startsWith("--ingest=")) {
				System.setProperty("spring.main.web-application-type", "none");
				break;
			}
		}
		SpringApplication.run(BackendApplication.class, args);
	}

}
