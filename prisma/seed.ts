import prisma from "../src/lib/db"
import { generateSlug } from "../src/lib/utils"

async function main() {
    const novels = await prisma.novel.findMany()

    novels.forEach(async (novel) => {

        await prisma.novel.update({
            where: {
                id: novel.id,
            },
            data: {
                slug: generateSlug(novel.title)
            }
        })
    })
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })