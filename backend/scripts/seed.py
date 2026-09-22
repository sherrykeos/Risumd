from datetime import date
from pathlib import Path
import sys

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.database import SessionLocal, engine
from app.models.base import Base
from app.models.technology import Technology
from app.models.skill import Skill
from app.models.achievement import Achievement
from app.models.education import Education
from app.models.project import Project
from app.models.experience import Experience
from app.models.job import Job
from app.models.jd_analysis import JDAnalysis
from app.services.technology_service import technology_service
from app.services.skill_service import skill_service
from app.services.project_service import project_service
from app.services.experience_service import experience_service
from app.services.job_service import job_service
from app.services.jd_analysis_service import jd_analysis_service
from app.schemas.project import ProjectCreate
from app.schemas.experience import ExperienceCreate
from app.schemas.job import JobCreate
from app.schemas.jd_analysis import JDAnalysisCreate


def seed_database():
    print("Seeding database with sample development data...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Career Vault Seed
        existing_proj = db.query(Project).filter(Project.name == "Example API Platform").first()
        if not existing_proj:
            print("Seeding Career Vault items...")
            # Sample Technologies
            technologies_data = [
                ("Python", "High-level programming language with dynamic semantics."),
                ("FastAPI", "Modern, fast web framework for building APIs with Python."),
                ("PostgreSQL", "Powerful open-source object-relational database system."),
                ("Docker", "Platform for building, sharing, and running containerized applications."),
                ("React", "Front-end JavaScript library for building user interfaces."),
                ("TypeScript", "Strongly typed programming language that builds on JavaScript."),
                ("Redis", "In-memory data structure store used as a database, cache, and message broker."),
            ]

            tech_map = {}
            for name, desc in technologies_data:
                tech = technology_service.get_by_name(db, name)
                if not tech:
                    tech = Technology(name=name, description=desc)
                    db.add(tech)
                    db.flush()
                tech_map[name] = tech
            print(f"Created/verified {len(technologies_data)} sample technologies.")

            # Sample Skills
            skills_data = [
                ("Backend Development", "Engineering", "Designing and building server-side applications and APIs."),
                ("Machine Learning", "Data Science", "Training and evaluating predictive models and data pipelines."),
                ("System Design", "Engineering", "Architecting scalable, resilient, and distributed software systems."),
                ("REST API Design", "Engineering", "Designing clean, intuitive, and standard HTTP API endpoints."),
            ]

            skill_map = {}
            for name, category, desc in skills_data:
                skill = skill_service.get_by_name(db, name)
                if not skill:
                    skill = Skill(name=name, category=category, description=desc)
                    db.add(skill)
                    db.flush()
                skill_map[name] = skill
            print(f"Created/verified {len(skills_data)} sample skills.")

            # Sample Education
            education = Education(
                institution="Metropolitan Institute of Technology",
                degree="Bachelor of Science",
                field="Computer Science",
                start_date=date(2018, 9, 1),
                end_date=date(2022, 6, 15),
                grade="3.85 GPA",
                description="Focused on distributed systems, algorithms, and software architecture. Graduated with Honors.",
            )
            db.add(education)
            print("Created sample education entry.")

            # Sample Projects
            proj_data = ProjectCreate(
                name="Example API Platform",
                description="Scalable RESTful API platform designed for high-throughput transactional workflows.",
                role="Lead Backend Engineer",
                start_date=date(2023, 1, 15),
                end_date=date(2023, 8, 30),
                github_url="https://github.com/example/api-platform",
                live_url="https://api.example.com",
                technologies=["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
                skills=["Backend Development", "System Design", "REST API Design"],
                achievements=[
                    {
                        "title": "Architected low-latency microservice pipeline",
                        "description": "Reduced p99 response latency by 45% through aggressive connection pooling and caching.",
                        "date": date(2023, 6, 1),
                    },
                    {
                        "title": "Engineered automated test suite achieving 92% coverage",
                        "description": "Implemented end-to-end integration test framework preventing regressions.",
                        "date": date(2023, 7, 15),
                    },
                ],
            )
            project_service.create(db, proj_data)

            proj2_data = ProjectCreate(
                name="Flight Price Forecaster",
                description="Predictive platform estimating airfare fluctuations using gradient boosting algorithms.",
                role="ML Engineer",
                start_date=date(2023, 9, 1),
                end_date=date(2024, 2, 28),
                github_url="https://github.com/example/flight-forecaster",
                technologies=["Python", "Docker", "PostgreSQL"],
                skills=["Machine Learning", "Backend Development"],
                achievements=[
                    {
                        "title": "Built flight price prediction pipeline with 93% accuracy",
                        "description": "Trained XGBoost models on historical airfare data with automated feature drift monitoring.",
                        "date": date(2024, 1, 20),
                    }
                ],
            )
            project_service.create(db, proj2_data)
            print("Created sample projects with normalized associations.")

            # Sample Experience
            exp_data = ExperienceCreate(
                company="Acme Cloud Solutions",
                role="Senior Software Engineer",
                description="Responsible for core backend microservices and database infrastructure.",
                start_date=date(2022, 7, 1),
                end_date=None,
                location="San Francisco, CA (Remote)",
                technologies=["Python", "FastAPI", "PostgreSQL", "Docker"],
                skills=["Backend Development", "System Design"],
                achievements=[
                    {
                        "title": "Led cloud migration to containerized infrastructure",
                        "description": "Successfully migrated 12 legacy services with zero downtime during business hours.",
                        "date": date(2023, 11, 10),
                    }
                ],
            )
            experience_service.create(db, exp_data)
            print("Created sample experience with normalized associations.")
        else:
            print("Career Vault sample data already exists. Skipping Career Vault seed.")

        # 2. Jobs & JD Analysis Seed (Phase 2)
        existing_job = db.query(Job).filter(Job.company == "Example Technologies").first()
        if not existing_job:
            print("Seeding sample Jobs and JD Analysis...")
            job1_data = JobCreate(
                company="Example Technologies",
                title="Junior Backend Developer",
                location="Delhi",
                source_url="https://example.com/careers/junior-backend",
                raw_description=(
                    "We are looking for a backend developer familiar with Java, Spring Boot, "
                    "REST APIs, PostgreSQL, and Docker to join our core product engineering team."
                ),
            )
            job1 = job_service.create(db, job1_data)

            # Seed sample JDAnalysis for job1
            analysis1_data = JDAnalysisCreate(
                seniority="Junior",
                domain="Backend Development",
                required_skills=["Java", "Spring Boot", "REST APIs"],
                preferred_skills=["Docker"],
                technologies=["PostgreSQL", "Docker", "Git"],
                responsibilities=[
                    "Build and maintain REST APIs using Spring Boot",
                    "Write automated tests and collaborate on code reviews",
                    "Maintain relational schemas and optimize database queries",
                ],
                keywords=["Java", "Spring Boot", "REST", "PostgreSQL", "backend"],
                summary="Junior backend engineering role focused on Java, Spring Boot microservices, and PostgreSQL database maintenance.",
            )
            jd_analysis_service.create(db, job1.id, analysis1_data)

            # Second job without analysis
            job2_data = JobCreate(
                company="Nexus Cloud Systems",
                title="Platform Engineer",
                location="Remote",
                source_url="https://nexuscloud.io/jobs/platform-eng",
                raw_description=(
                    "Join our platform infrastructure team. We build internal developer platforms, "
                    "Kubernetes orchestration pipelines, and high-throughput telemetry services in Go and Python."
                ),
            )
            job_service.create(db, job2_data)
            print("Created sample jobs and JD analysis.")
        else:
            print("Jobs sample data already exists. Skipping Jobs seed.")

        db.commit()
        print("Sample data successfully verified/seeded!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
