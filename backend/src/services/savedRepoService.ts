import * as savedRepoModel from '../models/savedRepo.model';

interface SaveRepoInput {
  userId:    string;
  repoUrl:   string;
  repoOwner: string;
  repoName:  string;
}

export const savedRepoService = {
  async save(params: SaveRepoInput) {
    return savedRepoModel.insert(params);
  },

  async list(userId: string) {
    return savedRepoModel.findByUser(userId);
  },

  async remove(userId: string, savedRepoId: string) {
    return savedRepoModel.deleteByUserAndId(userId, savedRepoId);
  },
};