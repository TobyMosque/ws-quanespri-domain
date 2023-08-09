import { fakerEN_US as faker } from '@faker-js/faker';
import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uid } from 'uuid';

const avatars = {
  men: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
    60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,
    79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94,
  ],
  women: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
    60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,
    79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94,
  ],
  lego: [1, 2, 3, 4, 5, 6, 7, 8],
};

const companies: Prisma.CompanyCreateManyInput[] = [];
const jobs: Prisma.JobCreateManyInput[] = [];
const people: Prisma.PersonCreateManyInput[] = [];

const _date = new Date();
function comb({ date }: { date?: Date } = {}) {
  if (!date) {
    _date.setTime(_date.getTime() + 1);
    date = _date;
  }
  const uuid = uid();
  let comb = ('00000000000' + date.getTime().toString(16)).substr(-12);
  comb = comb.slice(0, 8) + '-' + comb.slice(8, 12);
  return uuid.replace(uuid.slice(0, 13), comb);
}

function getCompanyName() {
  let name = faker.company.name();
  while (companies.some((j) => j.name === name)) {
    name = faker.company.name();
  }
  return name;
}
function getJobName() {
  let name = faker.name.jobTitle();
  while (jobs.some((j) => j.name === name)) {
    name = faker.name.jobTitle();
  }
  return name;
}
function getPersonInfo(gender: 'male' | 'female') {
  let firstName = faker.name.firstName(gender);
  let lastName = faker.name.lastName(gender);
  while (
    people.some((j) => j.firstName === firstName && j.lastName === lastName)
  ) {
    firstName = faker.name.firstName(gender);
    lastName = faker.name.lastName(gender);
  }
  const section = gender === 'male' ? 'men' : 'women';
  
  const index = faker.number.int(avatars[section].length);
  const avatar = `https://randomuser.me/api/portraits/${section}/${index}.jpg`;
  const email = faker.internet.email(firstName, lastName).toLowerCase();
  return { firstName, lastName, email, avatar };
}

for (let i = 0; i < 50; i++) {
  companies.push({
    companyId: comb(),
    name: getCompanyName(),
  });
}

for (let i = 0; i < 100; i++) {
  jobs.push({
    jobId: comb(),
    name: getJobName(),
  });
}

for (let i = 0; i < 800; i++) {
  const companyIndex = Math.floor(Math.random() * Math.floor(companies.length));
  const jobIndex = Math.floor(Math.random() * Math.floor(jobs.length));
  const company = companies[companyIndex];
  const job = jobs[jobIndex];
  const index = faker.number.int({ min: 0, max: 1 });
  const gender = ['male', 'female'][index] as 'male' | 'female';
  const { firstName, lastName, email, avatar } = getPersonInfo(gender);

  people.push({
    personId: comb(),
    avatar: avatar,
    firstName: firstName,
    lastName: lastName,
    email: email,
    companyId: company.companyId || '',
    jobId: job.jobId || '',
  });
}

const prisma = new PrismaClient();
async function main() {
  const job = await prisma.job.findFirst({
    select: {
      jobId: true,
    },
  });
  if (job?.jobId) {
    return;
  }
  const company = await prisma.company.findFirst({
    select: {
      companyId: true,
    },
  });
  if (company?.companyId) {
    return;
  }
  const person = await prisma.person.findFirst({
    select: {
      personId: true,
    },
  });
  if (person?.personId) {
    return;
  }

  const createJobs = prisma.job.createMany({
    data: jobs,
  });
  const createCompanies = prisma.company.createMany({
    data: companies,
  });
  const createPeople = prisma.person.createMany({
    data: people,
  });
  await prisma.$transaction([createJobs, createCompanies, createPeople]);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    return prisma.$disconnect();
  });