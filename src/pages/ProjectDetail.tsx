import { useParams, Link } from "react-router-dom";
import { projects } from "../data/portfolio-data";

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4">Project not found</h2>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to work
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="section-padding border-b border-border">
        <div className="container-narrow">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block mb-8"
          >
            ← Back to work
          </Link>

          <h1 className="mb-6">{project.name}</h1>

          {/* Taxonomy */}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>{project.type}</span>
            <span>·</span>
            <span>{project.role}</span>
            <span>·</span>
            <span>{project.maturity}</span>
            <span>·</span>
            <span>{project.scope}</span>
          </div>
        </div>
      </section>

      {/* Content sections - strict structure */}
      <section className="section-padding">
        <div className="container-narrow space-y-16">
          {/* Context */}
          <div className="space-y-3">
            <h4 className="text-sm uppercase tracking-wide text-muted-foreground">
              Context
            </h4>
            <p className="leading-relaxed">{project.context}</p>
          </div>

          {/* Constraint */}
          <div className="space-y-3">
            <h4 className="text-sm uppercase tracking-wide text-muted-foreground">
              Constraint
            </h4>
            <p className="leading-relaxed">{project.constraint}</p>
          </div>

          {/* Action */}
          <div className="space-y-3">
            <h4 className="text-sm uppercase tracking-wide text-muted-foreground">
              Action
            </h4>
            <p className="leading-relaxed">{project.action}</p>
          </div>

          {/* Outcome */}
          <div className="space-y-3">
            <h4 className="text-sm uppercase tracking-wide text-muted-foreground">
              Outcome
            </h4>
            <p className="leading-relaxed">{project.outcome}</p>
          </div>

          {/* Metrics (if available) */}
          {project.metrics && project.metrics.length > 0 && (
            <div className="space-y-4 border-t border-border pt-16">
              <h4 className="text-sm uppercase tracking-wide text-muted-foreground">
                Key Metrics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.metrics.map((metric, index) => (
                  <div key={index} className="text-sm">
                    {metric}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Artifacts */}
          {project.artifacts && project.artifacts.length > 0 && (
            <div className="space-y-6 border-t border-border pt-16">
              <h4 className="text-sm uppercase tracking-wide text-muted-foreground">
                Artifacts
              </h4>
              <div className="grid grid-cols-1 gap-8">
                {project.artifacts.map((artifact, index) => (
                  <div key={index}>
                    {artifact.type === "image" ? (
                      <div>
                        <img
                          src={artifact.url}
                          alt={artifact.alt || "Project artifact"}
                          className="w-full border border-border"
                        />
                        {artifact.caption && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {artifact.caption}
                          </p>
                        )}
                      </div>
                    ) : artifact.type === "link" ? (
                      <a
                        href={artifact.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-accent transition-colors"
                      >
                        {artifact.caption || artifact.url} →
                      </a>
                    ) : (
                      <div>
                        <img
                          src={artifact.url}
                          alt={artifact.alt || "Project diagram"}
                          className="w-full border border-border"
                        />
                        {artifact.caption && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {artifact.caption}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
