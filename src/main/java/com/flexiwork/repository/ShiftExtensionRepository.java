package com.flexiwork.repository;

import com.flexiwork.entity.JobPost;
import com.flexiwork.entity.ShiftExtension;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShiftExtensionRepository extends JpaRepository<ShiftExtension, Long> {

    List<ShiftExtension> findByJobPostOrderByIdAsc(JobPost jobPost);
}
