package com.flexiwork.security;

import com.flexiwork.entity.User;
import com.flexiwork.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Reads a Bearer token from the Authorization header, validates it, and populates the security
 * context. The token is only the entry point: the user's <em>current</em> state is re-read from the
 * database on every request so that a deactivated, suspended, or role-changed account loses access
 * immediately rather than retaining whatever the token claimed for up to its 24h lifetime. The role
 * authority granted is the live DB role, not the (possibly stale) token claim.
 *
 * <p>Stateless — runs once per request on the {@code /api/**} chain. Invalid/expired tokens, unknown
 * users, and inactive users are simply ignored so the request proceeds unauthenticated and is
 * rejected later by authorization rules (401/403).
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = header.substring(7);
            try {
                Claims claims = jwtService.parse(token);
                Long userId = claims.get("uid", Number.class).longValue();

                // Re-validate against the database every request: the token alone is never trusted
                // for active-status or role. A banned/deactivated user, or one whose role changed,
                // is rejected here even while their token is technically still unexpired.
                User user = userRepository.findById(userId).orElse(null);
                if (user != null && user.isActive()) {
                    var authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
                    var authentication = new UsernamePasswordAuthenticationToken(
                            userId, null, List.of(authority));
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    SecurityContextHolder.clearContext();
                }
            } catch (JwtException | IllegalArgumentException ex) {
                // Invalid token: leave the context unauthenticated.
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
