import { ProjectCard } from "../components/ProjectCard";
import { projects } from "../data/portfolio-data";

export function Home() {
  // Sort projects by order
  const sortedProjects = [...projects].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="section-padding border-b border-border">
        <div className="container-narrow">
          <h1 className="mb-4">
            Operator who builds systems and tools
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Selected projects from logistics operations, analytics, and internal tools.
          </p>
        </div>
      </section>

      {/* Project gallery */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sortedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-border py-12">
        <div className="container-wide">
          <p className="text-sm text-muted-foreground">
            Available for operations leadership, product development, and analytics consulting.
          </p>
        </div>
      </section>
    </div>
  );
}
