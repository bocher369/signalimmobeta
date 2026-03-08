import { supabase } from '../supabaseClient';

export const getSignedUrl = async (path: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase.storage
            .from('properties')
            .createSignedUrl(path, 3600); // 1 hour expiry

        if (error) throw error;
        return data.signedUrl;
    } catch (error) {
        console.error('Error getting signed URL:', error);
        return null;
    }
};

export const deleteFileFromSupabase = async (path: string): Promise<boolean> => {
    try {
        const { error } = await supabase.storage
            .from('properties')
            .remove([path]);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};
