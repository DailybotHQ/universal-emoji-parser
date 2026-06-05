# Preset — Spring Boot (Java / Kotlin)

> Reasoning aid, not a template. Verify every assumption against the live repo;
> detected reality wins. Capture the **real** validation command, not the
> example below.

## Signals that identify this stack

- Build manifest: `pom.xml` (Maven) **or** `build.gradle`/`build.gradle.kts`
  (Gradle), declaring `spring-boot-starter-parent` / the Spring Boot plugin and
  `spring-boot-starter-*` dependencies. **Infer the build tool from which file
  is present.**
- A wrapper: `./mvnw` (`.mvn/wrapper/`) or `./gradlew` (`gradle/wrapper/`) — use
  it, not a global Maven/Gradle.
- Source layout `src/main/java` (or `src/main/kotlin`) + `src/test/java`, and a
  `@SpringBootApplication`-annotated entrypoint with `SpringApplication.run(...)`.
- The layered stereotype model: `@RestController`/`@Controller`, `@Service`,
  `@Repository` (often Spring Data `JpaRepository`), `@Configuration`,
  `@Component`, with constructor injection.
- Config in `src/main/resources/application.yml` / `application.properties`,
  often with profile variants (`application-<profile>.yml`).

## What to look for in recon

- The **real** test command: `./mvnw test` (Maven Surefire/Failsafe) or
  `./gradlew test`, running JUnit 5 with Spring Boot Test
  (`@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest`, `MockMvc`, Testcontainers).
  Capture the exact wrapper invocation.
- The **real** lint/format gate: Checkstyle, Spotless, PMD, SpotBugs, or
  ktlint/detekt (Kotlin) — and how it's invoked (`./mvnw verify`,
  `./gradlew check`, `spotlessApply`).
- Build tool specifics: Maven phases/profiles vs Gradle tasks; the full build
  command (`./mvnw verify` vs `./gradlew build`).
- Persistence layer: Spring Data JPA/JDBC, Hibernate, and the migration tool
  (Flyway `db/migration/V*.sql` or Liquibase changelogs).
- Configuration and secrets: active profiles (`SPRING_PROFILES_ACTIVE`),
  externalized config, and where secrets resolve from (env vars, Vault, config
  server).

## Stack-specific skills/agents/commands to generate

- Skills: `controller-add` (`@RestController` + request mapping + test),
  `service` (`@Service` business-logic bean + test), `repository` (Spring Data
  repository + entity), `entity` (`@Entity` + migration), optionally `migration`
  (Flyway/Liquibase) and `config-properties` (`@ConfigurationProperties`).
- Agents: baseline roles + an `api-reviewer` / `persistence-author` persona
  aware of transaction boundaries, layering, and migration safety.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — layering (controller → service → repository → entity),
  Spring context/bean wiring, transaction boundaries, REST surface.
- `TESTING_GUIDE.md` — JUnit 5 + Spring Boot Test slices (`@WebMvcTest` /
  `@DataJpaTest`), `MockMvc`, Testcontainers, how to scope a single test class
  with `-Dtest=` (Maven) or `--tests` (Gradle).
- `SECURITY.md` — Spring Security config, auth (JWT/OAuth2/sessions),
  externalized secrets, profile-based config.
- Per-module docs: one per domain/feature package (its controllers, services,
  repositories, entities).

## Typical validation command (FIND the real one)

Often `./mvnw verify` (Maven) or `./gradlew check` (Gradle) — which run tests
plus the lint/format/static-analysis gates. **Do not assume** the build tool or
goals — read `pom.xml`/`build.gradle`/CI and capture the exact wrapper command.
