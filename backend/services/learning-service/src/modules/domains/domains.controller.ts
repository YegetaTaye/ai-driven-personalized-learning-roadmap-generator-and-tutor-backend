import { Request, Response, NextFunction } from 'express';
import * as domainsService from './domains.service';
import { createDomainSchema, updateDomainSchema } from './domains.validation';
import { ApiError } from '../../utils/ApiError';

export async function listDomains(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const domains = await domainsService.listDomains();
    res.json({ domains });
  } catch (err) {
    next(err);
  }
}

export async function getDomainBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const domain = await domainsService.getDomainBySlug(req.params.slug);
    res.json({ domain });
  } catch (err) {
    next(err);
  }
}

export async function createDomain(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { error, value } = createDomainSchema.validate(req.body);
    if (error) return next(ApiError.badRequest(error.message));
    const domain = await domainsService.createDomain(value);
    res.status(201).json({ domain });
  } catch (err) {
    next(err);
  }
}

export async function deleteDomain(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await domainsService.deleteDomain(req.params.id, req.user!.role);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function updateDomain(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { error, value } = updateDomainSchema.validate(req.body);
    if (error) return next(ApiError.badRequest(error.message));
    const domain = await domainsService.updateDomain(req.params.id, value);
    res.json({ domain });
  } catch (err) {
    next(err);
  }
}
