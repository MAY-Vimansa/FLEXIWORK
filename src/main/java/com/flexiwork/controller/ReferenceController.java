package com.flexiwork.controller;

import com.flexiwork.entity.enums.District;
import com.flexiwork.entity.enums.JobCategory;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

/**
 * Reference/enum lookups for populating frontend dropdowns. These are hot, rarely-changing reads,
 * so they are cached ({@code @Cacheable}) — satisfying the caching requirement.
 */
@RestController
@RequestMapping("/api/reference")
@Tag(name = "Reference data")
public class ReferenceController {

    @GetMapping("/districts")
    @Cacheable("districts")
    @Operation(summary = "List Sri Lankan districts (cached)")
    public List<DistrictDto> districts() {
        return Arrays.stream(District.values())
                .map(d -> new DistrictDto(d.name(), d.getCenterLat(), d.getCenterLng()))
                .toList();
    }

    @GetMapping("/categories")
    @Cacheable("categories")
    @Operation(summary = "List job categories (cached)")
    public List<String> categories() {
        return Arrays.stream(JobCategory.values()).map(Enum::name).toList();
    }

    public record DistrictDto(String name, double centerLat, double centerLng) {
    }
}
