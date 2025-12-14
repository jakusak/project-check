import { Link } from "react-router-dom";
import { Project } from "../types/portfolio";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      to={`/project/${project.id}`}
      className="group block border border-border p-6 transition-all hover:border-foreground"
    >
      <div className="space-y-4">
        {/* Project name */}
        <h3 className="text-xl font-normal group-hover:text-accent transition-colors">
          {project.name}
        </h3>

        {/* Taxonomy */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground uppercase tracking-wide">
          <span>{project.type}</span>
          <span>·</span>
          <span>{project.role}</span>
        </div>

        {/* Signal line */}
        <p className="text-sm text-foreground leading-relaxed">
          {project.signalLine}
        </p>

        {/* Hover state: show maturity */}
        <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          {project.maturity}
        </div>
      </div>
    </Link>
  );
}
