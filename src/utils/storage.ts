import { supabase } from '../supabaseClient';

export const uploadFileToSupabase = async (
  file: File,
  featureName: string,
  itemId: string
): Promise<string> => {
  console.log('Starting upload for:', file.name);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    throw new Error('User not authenticated');
  }
  console.log('User authenticated:', user.id);

  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${user.id}/${featureName}/${itemId}/${fileName}`;
  console.log('Uploading to path:', filePath);

  const uploadPromise = supabase.storage
    .from('app-files')
    .upload(filePath, file);

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Upload timed out')), 15000)
  );

  const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw uploadError;
  }
  console.log('Upload successful:', filePath);

  return filePath;
};

export const getSignedUrl = async (filePath: string): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from('app-files')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) return null;
  return data.signedUrl;
};

export const deleteFileFromSupabase = async (filePath: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('app-files')
    .remove([filePath]);

  if (error) throw error;
};
