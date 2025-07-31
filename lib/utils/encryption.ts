import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.GARMIN_ENCRYPTION_KEY || 'default-encryption-key-change-in-production'

export const encryptPassword = (password: string): string => {
  return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString()
}

export const decryptPassword = (encryptedPassword: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}