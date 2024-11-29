import {prisma} from '../prisma/client.js';

let currentNID = 10000000;

// Function to generate NID
function generateNID() {
    currentNID++;
    return `U${currentNID}`;
}

export const interact = async (req, res) => {

    const Uid = req.id;
    const {Aid,timeToadd,action} = req.body;

    if (!Uid || !Aid || !timeToadd || !action) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Proceed with the interaction logic
    try {

        
        const existingInteraction = await prisma.interaction.findFirst({
            where: {
            Uid,
            Aid,
            action
            }
        });

        if (existingInteraction) {
           
            const updatedInteraction = await prisma.interaction.update({
                where: {
                    id: existingInteraction.id
                },
                data: {
                    timeToadd: existingInteraction.Totaltime + timeToadd,
                    counter : existingInteraction.counter + 1
                }
            });

            if(!updatedInteraction){
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            return res.status(409).json({ existingInteraction, message: 'Interaction already exists, updated the timeToadd' });
        }


        const createInteraction = await prisma.interaction.create({
            data: {
                Uid,
                Aid,
                timeToadd,
                action,
                id: generateNID()
            }
        });
        res.status(201).json(createInteraction);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }


}


