package com.flexiwork.config;

import com.flexiwork.security.AppUserDetailsService;
import com.flexiwork.security.JwtAuthFilter;
import com.flexiwork.security.RestAuthEntryPoint;
import com.flexiwork.service.LoginAttemptService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Dual authentication (core academic requirement). Two independent filter chains:
 *
 * <ul>
 *   <li><b>Chain 1 — {@code /api/**}</b>: stateless JWT, CSRF disabled (header-based auth),
 *       method-level {@code @PreAuthorize} for fine-grained role checks.</li>
 *   <li><b>Chain 2 — {@code /admin/**}, {@code /login}, {@code /logout}</b>: session + cookie
 *       form login for the Thymeleaf admin panel, CSRF enabled, 30-min timeout, single session.</li>
 * </ul>
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final AppUserDetailsService userDetailsService;
    private final RestAuthEntryPoint restAuthEntryPoint;
    private final LoginAttemptService loginAttemptService;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                          AppUserDetailsService userDetailsService,
                          RestAuthEntryPoint restAuthEntryPoint,
                          LoginAttemptService loginAttemptService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
        this.restAuthEntryPoint = restAuthEntryPoint;
        this.loginAttemptService = loginAttemptService;
    }

    // ---------------------------------------------------------------------
    // Chain 1: REST API — stateless JWT
    // ---------------------------------------------------------------------
    @Bean
    @org.springframework.core.annotation.Order(1)
    public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex.authenticationEntryPoint(restAuthEntryPoint))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/register/**").permitAll()
                        .requestMatchers("/api/auth/password/**").permitAll()
                        .requestMatchers("/api/contact").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/jobs", "/api/jobs/**").permitAll()
                        .requestMatchers("/api/reference/**").permitAll()
                        .requestMatchers("/api/files/kyc/**").denyAll()
                        .requestMatchers("/api/files/**").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // ---------------------------------------------------------------------
    // Chain 2: Admin panel — session + cookie, CSRF on
    // ---------------------------------------------------------------------
    @Bean
    @org.springframework.core.annotation.Order(2)
    public SecurityFilterChain adminFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/admin/**", "/login", "/logout", "/css/**")
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/login", "/css/**").permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                // Eager CSRF token loading: with large server-rendered admin pages the response
                // buffer can flush before the form is reached, and a session-creating CSRF write at
                // that point would throw "Cannot create a session after the response has been
                // committed". Setting the request-attribute name to null loads (and persists) the
                // token up-front in the CsrfFilter, before any body is streamed.
                .csrf(csrf -> csrf
                        .csrfTokenRepository(new HttpSessionCsrfTokenRepository())
                        .csrfTokenRequestHandler(eagerCsrfTokenRequestHandler()))
                .formLogin(form -> form
                        .loginPage("/login")
                        .successHandler((request, response, authentication) -> {
                            loginAttemptService.onSuccess(authentication.getName());
                            response.sendRedirect("/admin");
                        })
                        .failureHandler((request, response, exception) -> {
                            String username = request.getParameter("username");
                            if (username != null) {
                                loginAttemptService.onFailure(username);
                            }
                            response.sendRedirect("/login?error");
                        })
                        .permitAll())
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login?logout")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID"))
                .sessionManagement(sm -> sm
                        .maximumSessions(1)
                        .maxSessionsPreventsLogin(false));
        return http.build();
    }

    /** CSRF handler that loads the token eagerly (non-deferred) so the session/cookie is written
     *  before the response body is committed. */
    private static CsrfTokenRequestAttributeHandler eagerCsrfTokenRequestHandler() {
        CsrfTokenRequestAttributeHandler handler = new CsrfTokenRequestAttributeHandler();
        handler.setCsrfRequestAttributeName(null);
        return handler;
    }

    @org.springframework.beans.factory.annotation.Value("${flexiwork.cors.allowed-origins:http://localhost:5173}")
    private String[] corsAllowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Vite dev server by default; set FLEXIWORK_CORS_ALLOWED_ORIGINS (comma-separated) in
        // production to the real frontend origin(s).
        config.setAllowedOrigins(List.of(corsAllowedOrigins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** Used only by the admin Thymeleaf form login (the REST API login does its own check directly
     *  in {@code AuthService}). Checks the lockout before delegating so a brute-forced admin
     *  account is blocked the same way the REST login already is. */
    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider delegate = new DaoAuthenticationProvider();
        delegate.setUserDetailsService(userDetailsService);
        delegate.setPasswordEncoder(passwordEncoder());
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider() {
            @Override
            public Authentication authenticate(Authentication authentication) throws AuthenticationException {
                try {
                    loginAttemptService.checkNotLocked(authentication.getName());
                } catch (com.flexiwork.exception.BusinessException locked) {
                    throw new org.springframework.security.authentication.LockedException(locked.getMessage());
                }
                return delegate.authenticate(authentication);
            }

            @Override
            public boolean supports(Class<?> authentication) {
                return delegate.supports(authentication);
            }
        };
        return new org.springframework.security.authentication.ProviderManager(provider);
    }
}
