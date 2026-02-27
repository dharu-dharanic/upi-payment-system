package com.upi.payment.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "UPI Payment Simulation API",
        version = "1.0",
        description = "Production-grade UPI-like payment system API with ACID transactions, fraud detection, and idempotency",
        contact = @Contact(name = "Dev Team", email = "dev@upi-sim.com"),
        license = @License(name = "MIT")
    ),
    servers = {
        @Server(url = "http://localhost:8080", description = "Local development"),
    }
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT"
)
public class SwaggerConfig {
}
