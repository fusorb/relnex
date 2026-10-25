"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import "swagger-ui-react/swagger-ui.css";
import { openApiSpec } from "@/lib/useful/openapi";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 px-6 text-center text-sm font-medium text-slate-400 shadow-[0_24px_0_0_#000]">
      Initializing Relnex API console...
    </div>
  ),
});

type Method = "get" | "post" | "put" | "patch" | "delete";
type MethodCount = Record<Method, number>;

type OpenApiOperation = {
  summary?: string;
  description?: string;
};

type OpenApiPathItem = Partial<Record<Method, OpenApiOperation>>;

const METHODS: Method[] = ["get", "post", "put", "patch", "delete"];

const METHOD_LABELS: Record<Method, string> = {
  get: "GET",
  post: "POST",
  put: "PUT",
  patch: "PATCH",
  delete: "DELETE",
};

const METHOD_BADGE_STYLES: Record<Method, string> = {
  get: "border-emerald-600 bg-emerald-500/10 text-emerald-300",
  post: "border-sky-600 bg-sky-500/10 text-sky-300",
  put: "border-amber-600 bg-amber-500/10 text-amber-300",
  patch: "border-violet-600 bg-violet-500/10 text-violet-300",
  delete: "border-rose-600 bg-rose-500/10 text-rose-300",
};

const PATH_GROUPS = [
  {
    label: "Auth",
    prefix: "/api/auth",
    summary: "Session lifecycle, onboarding, and current identity access.",
  },
  {
    label: "Users",
    prefix: "/api/users",
    summary:
      "Public profiles, directory listing, profile editing, analytics, and nested user views.",
  },
  {
    label: "Resources",
    prefix: "/api/resources",
    summary:
      "Resource lifecycle, publication, graph relations, tags, comments, telemetry, and versioning.",
  },
  {
    label: "Collections",
    prefix: "/api/collections",
    summary:
      "Collection management, ordering, and collection-resource linking.",
  },
  {
    label: "Comments",
    prefix: "/api/comments",
    summary: "Threaded comment edits and reply handling.",
  },
  {
    label: "Search",
    prefix: "/api/search",
    summary: "Resource search with filters, pagination, and tenant scope.",
  },
  {
    label: "Tags",
    prefix: "/api/tags",
    summary: "Taxonomy creation and listing.",
  },
  {
    label: "Uploads",
    prefix: "/api/uploads",
    summary: "Presigned upload provisioning for object storage.",
  },
] as const;

const paths = openApiSpec.paths as Record<string, OpenApiPathItem>;

function getMethodCounts() {
  const counts: MethodCount = {
    get: 0,
    post: 0,
    put: 0,
    patch: 0,
    delete: 0,
  };

  for (const path of Object.values(paths)) {
    for (const method of METHODS) {
      if (path[method]) counts[method] += 1;
    }
  }

  return counts;
}

function getEndpointCount() {
  return Object.values(paths).reduce((total, path) => {
    return total + METHODS.filter((method) => Boolean(path[method])).length;
  }, 0);
}

function getPathCount() {
  return Object.keys(paths).length;
}

function getRouteGroups() {
  return PATH_GROUPS.map((group) => {
    const endpoints = Object.entries(paths).filter(([pathname]) =>
      pathname.startsWith(group.prefix),
    );

    const methods = endpoints.flatMap(([, operations]) =>
      METHODS.filter((method) => Boolean(operations[method])),
    );

    return {
      ...group,
      pathCount: endpoints.length,
      endpointCount: methods.length,
      methods: Array.from(new Set(methods)),
    };
  });
}

function getOperationSummary(pathname: string) {
  const operations = paths[pathname];
  if (!operations) return [];

  return METHODS.filter((method) => Boolean(operations[method])).map(
    (method) => ({
      method,
      summary: operations[method]?.summary ?? "",
      description: operations[method]?.description ?? "",
    }),
  );
}

function ApiDocBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
      {label}
    </span>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-[0_20px_0_0_#000]">
      <div className="mb-5">
        <h2 className="text-xl font-black tracking-tight text-white">
          {title}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

export default function ApiDocsPage() {
  const methodCounts = useMemo(() => getMethodCounts(), []);
  const routeGroups = useMemo(() => getRouteGroups(), []);
  const endpointCount = useMemo(() => getEndpointCount(), []);
  const pathCount = useMemo(() => getPathCount(), []);
  const authOperations = useMemo(
    () => getOperationSummary("/api/auth/register"),
    [],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap gap-2">
                <ApiDocBadge label="Relnex API Docs" />
                <ApiDocBadge label="OpenAPI 3.0" />
                <ApiDocBadge label="System Contract" />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Relnex API Console
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                This console documents the real application surface: auth,
                users, resources, collections, comments, tags, search, uploads,
                and nested route actions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
              >
                Return home
              </Link>
              <a
                href="#swagger-reference"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-200"
              >
                Jump to spec
              </a>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-[0_14px_0_0_#000]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Paths
              </p>
              <p className="mt-3 text-3xl font-black text-white">{pathCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-[0_14px_0_0_#000]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Operations
              </p>
              <p className="mt-3 text-3xl font-black text-white">
                {endpointCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-[0_14px_0_0_#000]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Methods
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {METHODS.map((method) => (
                  <span
                    key={method}
                    className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${METHOD_BADGE_STYLES[method]}`}
                  >
                    {METHOD_LABELS[method]} {methodCounts[method]}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-[0_14px_0_0_#000]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Primary auth route
              </p>
              <p className="mt-3 text-lg font-bold text-white">
                /api/auth/register
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {authOperations[0]?.summary || "Register a new user account."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <SectionCard
          title="System map"
          description="A concise overview of the route families represented by the spec."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {routeGroups.map((group) => (
              <div
                key={group.prefix}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {group.label}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {group.summary}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-300">
                    {group.pathCount} paths
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.methods.map((method) => (
                    <span
                      key={method}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${METHOD_BADGE_STYLES[method]}`}
                    >
                      {METHOD_LABELS[method]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Representation notes"
          description="The API reflects the actual Relnex data model and user flows."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                title: "Identity",
                text: "Auth endpoints issue sessions and expose the current safe user profile.",
              },
              {
                title: "Knowledge graph",
                text: "Resources support nested hierarchy, relations, versioning, metrics, tags, and usage telemetry.",
              },
              {
                title: "Collections and community",
                text: "Collections, comments, saved resources, and public profiles form the collaboration layer.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <h3 className="text-base font-black text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <section
          id="swagger-reference"
          className="overflow-hidden rounded-3xl border border-slate-800 bg-white shadow-[0_24px_0_0_#000]"
        >
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              Interactive OpenAPI reference
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Expand operations, inspect schemas, and use the live request
              explorer against the current spec.
            </p>
          </div>

          <div className="api-docs-swagger overflow-x-auto">
            <SwaggerUI
              spec={openApiSpec}
              docExpansion="list"
              defaultModelsExpandDepth={-1}
              displayRequestDuration
              deepLinking
              filter
              showExtensions
              showCommonExtensions
            />
          </div>
        </section>
      </main>

      <style jsx global>{`
        .api-docs-swagger .swagger-ui {
          font-family: var(--font-geist-sans), Arial, sans-serif;
        }

        .api-docs-swagger .swagger-ui .topbar {
          display: none;
        }

        .api-docs-swagger .swagger-ui .info {
          margin: 0;
        }

        .api-docs-swagger .swagger-ui .scheme-container {
          background: #fff;
          box-shadow: none;
          padding: 0;
        }

        .api-docs-swagger .swagger-ui .opblock {
          border-radius: 18px;
          border-width: 1px;
          box-shadow: none;
          overflow: hidden;
        }

        .api-docs-swagger .swagger-ui .opblock.opblock-get {
          border-color: rgba(16, 185, 129, 0.4);
          background: rgba(236, 253, 245, 0.7);
        }

        .api-docs-swagger .swagger-ui .opblock.opblock-post {
          border-color: rgba(14, 165, 233, 0.4);
          background: rgba(240, 249, 255, 0.7);
        }

        .api-docs-swagger .swagger-ui .opblock.opblock-put {
          border-color: rgba(245, 158, 11, 0.4);
          background: rgba(255, 251, 235, 0.7);
        }

        .api-docs-swagger .swagger-ui .opblock.opblock-patch {
          border-color: rgba(139, 92, 246, 0.4);
          background: rgba(250, 245, 255, 0.7);
        }

        .api-docs-swagger .swagger-ui .opblock.opblock-delete {
          border-color: rgba(244, 63, 94, 0.4);
          background: rgba(255, 241, 242, 0.7);
        }

        .api-docs-swagger .swagger-ui .opblock-summary,
        .api-docs-swagger .swagger-ui .opblock-body {
          border: 0;
        }

        .api-docs-swagger .swagger-ui .opblock-summary-path,
        .api-docs-swagger .swagger-ui .opblock-summary-description,
        .api-docs-swagger .swagger-ui .parameter__name,
        .api-docs-swagger .swagger-ui .parameter__type,
        .api-docs-swagger .swagger-ui .responses-inner h4,
        .api-docs-swagger .swagger-ui .response-col_description,
        .api-docs-swagger .swagger-ui .models,
        .api-docs-swagger .swagger-ui .model,
        .api-docs-swagger .swagger-ui .model-box {
          color: #0f172a;
        }

        .api-docs-swagger .swagger-ui .btn.execute,
        .api-docs-swagger .swagger-ui .btn.try-out__btn,
        .api-docs-swagger .swagger-ui .btn.cancel {
          border-radius: 12px;
          box-shadow: none;
        }

        .api-docs-swagger .swagger-ui textarea,
        .api-docs-swagger .swagger-ui input,
        .api-docs-swagger .swagger-ui select {
          border-radius: 12px;
        }

        @media (max-width: 640px) {
          .api-docs-swagger .swagger-ui .opblock-summary-path {
            word-break: break-word;
          }
        }
      `}</style>
    </div>
  );
}
