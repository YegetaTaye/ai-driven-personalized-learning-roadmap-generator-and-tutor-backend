import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import type { Domain, CreateDomainInput, UpdateDomainInput } from './domains.types';

export async function listDomains(): Promise<Domain[]> {
  return prisma.domain.findMany({ orderBy: { name: 'asc' } });
}

export async function getDomainBySlug(slug: string): Promise<Domain> {
  const domain = await prisma.domain.findUnique({ where: { slug } });
  if (!domain) throw ApiError.notFound('Domain not found');
  return domain;
}

export async function createDomain(data: CreateDomainInput): Promise<Domain> {
  // Auto-generate slug from name if not provided
  const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const dataWithSlug = { ...data, slug };
  
  const existing = await prisma.domain.findFirst({
    where: { OR: [{ name: data.name }, { slug }] },
  });
  if (existing) {
    const field = existing.name === data.name ? 'name' : 'slug';
    throw ApiError.conflict(`Domain with this ${field} already exists`);
  }
  return prisma.domain.create({ data: dataWithSlug });
}

/**
 * Delete a domain and all its ontology versions, nodes, and prerequisites.
 *
 * Role rules (enforced in the controller, not here):
 *  - admin      → can delete any domain regardless of ontology status
 *  - domain_expert → can only delete domains whose ontologies are all in
 *                    draft / in_review (not yet verified or published)
 */
export async function deleteDomain(id: string, userRole: string): Promise<void> {
  const domain = await prisma.domain.findUnique({
    where: { id },
    include: {
      ontologyVersions: { select: { id: true, status: true } },
    },
  });
  if (!domain) throw ApiError.notFound('Domain not found');

  // Domain experts may not delete published or verified domains
  if (userRole !== 'admin') {
    const blocked = domain.ontologyVersions.some(
      (v) => v.status === 'published' || v.status === 'verified',
    );
    if (blocked) {
      throw ApiError.forbidden(
        'Domain experts cannot delete a domain that has a published or verified ontology. Ask an admin.',
      );
    }
  }

  // Delete in dependency order — FK constraints are RESTRICT/NO ACTION so
  // Prisma cannot cascade automatically; we must delete child rows first.

  // 1. Get all enrollments for this domain
  const enrollments = await prisma.enrollment.findMany({
    where: { domainId: id },
    select: { id: true },
  });
  const enrollmentIds = enrollments.map((e) => e.id);

  if (enrollmentIds.length > 0) {
    // 2. Delete learner_node_progress (RESTRICT on enrollmentId)
    await prisma.learnerNodeProgress.deleteMany({
      where: { enrollmentId: { in: enrollmentIds } },
    });
    // 3. Delete enrollments (certificates, velocity, supplementary_nodes cascade)
    await prisma.enrollment.deleteMany({
      where: { id: { in: enrollmentIds } },
    });
  }

  // 4. Delete domain whitelist entries (RESTRICT on domainId)
  await prisma.domainWhitelist.deleteMany({ where: { domainId: id } });

  // 5. Get all ontology versions → delete nodes+prerequisites first
  const versions = await prisma.ontologyVersion.findMany({
    where: { domainId: id },
    select: { id: true },
  });
  const versionIds = versions.map((v) => v.id);

  if (versionIds.length > 0) {
    const nodes = await prisma.learningNode.findMany({
      where: { ontologyVersionId: { in: versionIds } },
      select: { id: true },
    });
    const nodeIds = nodes.map((n) => n.id);
    if (nodeIds.length > 0) {
      await prisma.nodePrerequisite.deleteMany({
        where: { OR: [{ nodeId: { in: nodeIds } }, { prerequisiteNodeId: { in: nodeIds } }] },
      });
      await prisma.learningNode.deleteMany({ where: { id: { in: nodeIds } } });
    }
    await prisma.ontologyVersion.deleteMany({ where: { id: { in: versionIds } } });
  }

  // 6. Finally delete the domain itself
  await prisma.domain.delete({ where: { id } });
}

export async function updateDomain(id: string, data: UpdateDomainInput): Promise<Domain> {
  const domain = await prisma.domain.findUnique({ where: { id } });
  if (!domain) throw ApiError.notFound('Domain not found');

  if (data.name && data.name !== domain.name) {
    const clash = await prisma.domain.findUnique({ where: { name: data.name } });
    if (clash) throw ApiError.conflict('Domain name already taken');
  }
  if (data.slug && data.slug !== domain.slug) {
    const clash = await prisma.domain.findUnique({ where: { slug: data.slug } });
    if (clash) throw ApiError.conflict('Domain slug already taken');
  }

  return prisma.domain.update({ where: { id }, data });
}
