import { UserData } from '$/contexts/CurrentUserProvider/CurrentUserContext';

export function hasValidUserProfile(data: UserData): boolean {
  return !!(data.email && data.name && data.username);
}
