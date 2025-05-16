export interface Message {
  id: number;
  userId: number;
  message: string;
  originalMessage: string;
  displayMessage?: string;
  originalLanguage?: string;
  photoUrl?: string;
  nickName?: string;
  isTranslated?: boolean;
}