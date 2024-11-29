import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
dotenv.config();

const UploadOnSupabase = async (filePath, bucketName, folder, type) => {

    const supabase = createClient(supabaseUrl, supabaseKey);

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


const handleUpload = async (filePath,bucketName,folder,type) => {
    
    console.log(filePath);
    console.log(bucketName);
    console.log(folder);
    

    if (!filePath) {
        console.log('Media not found');
        return null;
    }

    try {
        const url = await UploadOnSupabase(filePath, bucketName,folder,type);

        if (!url) {
            console.log('Error occurred while uploading image');
            return null; // Set url to null if upload fails
        } else {
          return url
        }
    } catch (error) {
        console.error('Error during image upload:', error);
        return null;
    }


};


const getAllFileUrls = async (bucketName, folder, type) => {
   
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
         
        console.log(bucketName,folder,type);
        

        const { data, error } = await supabase.storage
            .from(bucketName)
            .list(`${folder}/${type}`, { limit: 100 });

        if (error) {
            console.error('Error fetching file list:', error);
            return null;
        }

        const fileUrls = data.map(file => {
            const { publicURL } = supabase.storage
                .from(bucketName)
                .getPublicUrl(`${folder}/${type}/${file.name}`);
            return publicURL;
        });
          
        console.log(fileUrls);
        
        return fileUrls;
    } catch (error) {
        console.error('Unexpected error:', error);
        return null;
    }
};
export  {handleUpload,getAllFileUrls};
