import { Profile } from "../../types";

export interface IProfileService {
    getProfile(userId: string): Promise<any>;
    createProfile(profile: Profile): Promise<any>;
    updateProfile(profile: Profile): Promise<any>;
    deleteProfile(userId: string): Promise<any>;
}

