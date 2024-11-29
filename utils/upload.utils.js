import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
dotenv.config();

// Function to Upload media on Supabase
const UploadOnSupabase = async (filePath, bucketName, folder, type) => {

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!filePath) {console.log('Media not found');}
    if(!bucketName || !folder || !type) {console.log('Bucket Name, Folder and Type are required');}

    const fileName = path.basename(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream'; // Fallback MIME type
    const fileBuffer = fs.readFileSync(filePath);
   

    try {
        const { data, error } = await supabase.storage
            .from(`${bucketName}`) // Ensure this is your actual bucket name
            .upload(`${folder}/${type}/${fileName}`, fileBuffer, {
                contentType: mimeType, // Specify MIME type
                upsert: true,
            });


        if (error) {
            console.error('Upload error:', error.message);
            return null;
        }

        // Generate public URL
        const link = supabase.storage
            .from(`${bucketName}`)
            .getPublicUrl(`public/${fileName}`);

        if (!link) {
            console.error('Error generating public URL');
            return null;
        }
        // console.log(link.data.publicUrl);
        return link.data.publicUrl;


    } catch (error) {
        console.error('Unexpected error:', error.message);
        return null;
    }
    finally {
        // Clean up the file regardless of success or failure
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
};

// Function to handle media delete
const handleDelete = async (fileUrl, bucketName, folder, type) => {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract the file name from the URL
    const fileName = path.basename(fileUrl);

    try {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .remove([`${folder}/${type}/${fileName}`]);

        if (error) {
            console.error('Delete error:', error.message);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Unexpected error during delete:', error.message);
        return false;
    }
};

export  {UploadOnSupabase,handleDelete};
