package com.flexiwork.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flexiwork.dto.PageResponse;
import com.flexiwork.dto.job.JobResponse;
import com.flexiwork.service.JobService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Web-layer + security tests for the job endpoints: public feed is open, role rules are enforced by
 * method security, and invalid bodies produce a 400 with a per-field error map.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class JobControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean JobService jobService;

    private final Map<String, Object> validJob = Map.ofEntries(
            Map.entry("title", "Waiter"),
            Map.entry("description", "Serve guests at dinner"),
            Map.entry("category", "HOTEL"),
            Map.entry("district", "COLOMBO"),
            Map.entry("addressLine", "Galle Road"),
            Map.entry("latitude", 6.91),
            Map.entry("longitude", 79.86),
            Map.entry("jobDate", "2030-01-01"),
            Map.entry("startTime", "09:00:00"),
            Map.entry("endTime", "17:00:00"),
            Map.entry("dailyWage", 3500),
            Map.entry("workersNeeded", 3));

    @Test
    void publicFeed_isAccessibleWithoutAuth() throws Exception {
        when(jobService.feed(any(), anyInt(), anyInt()))
                .thenReturn(new PageResponse<>(List.of(), 0, 10, 0, 0, true, true));
        mockMvc.perform(get("/api/jobs"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "WORKER")
    void worker_cannotPostJob() throws Exception {
        mockMvc.perform(post("/api/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validJob)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "COMPANY_POSTER")
    void poster_canPostJob() throws Exception {
        when(jobService.create(any())).thenReturn(sampleResponse());
        mockMvc.perform(post("/api/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validJob)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "COMPANY")
    void invalidBody_returns400WithFieldErrors() throws Exception {
        Map<String, Object> bad = Map.of("title", "", "workersNeeded", 0, "latitude", 50.0);
        mockMvc.perform(post("/api/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").exists())
                .andExpect(jsonPath("$.fieldErrors.workersNeeded").exists())
                .andExpect(jsonPath("$.fieldErrors.description").exists());
    }

    private JobResponse sampleResponse() {
        return new JobResponse(1L, "Waiter", "desc", null, null, "addr", 6.91, 79.86,
                "link", null, null, null, null, 3, 0, 3, null, 1L, "ABC", null, null);
    }
}
