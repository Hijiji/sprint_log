import { DataSource } from 'typeorm';
import { Member } from '../entities/member.entity';
import { Sprint } from '../entities/sprint.entity';
import { Task } from '../entities/task.entity';
import { WorkLog } from '../entities/worklog.entity';
import { SprintStatusEnum } from 'src/common/enum/sprint-status.enum';
import { TaskStatusEnum } from 'src/common/enum/task-status.enum';
import { TaskPriorityEnum } from 'src/common/enum/task-priotity.enum';

export async function seedInitialData(dataSource: DataSource) {
  const memberRepository = dataSource.getRepository(Member);
  const sprintRepository = dataSource.getRepository(Sprint);
  const taskRepository = dataSource.getRepository(Task);
  const worklogRepository = dataSource.getRepository(WorkLog);

  // 기존 데이터 확인
  const memberCount = await memberRepository.count();
  const sprintCount = await sprintRepository.count();

  if (memberCount > 0 || sprintCount > 0) {
    return;
  }

  console.log('Seeding initial data');

  // 1. 멤버 2명 생성
  const member1 = memberRepository.create({
    memberId: 'member-001',
    name: '김철수',
    email: 'kim.chulsu@example.com',
    team: '개발팀',
    isEmployed: true,
  });

  const member2 = memberRepository.create({
    memberId: 'member-002',
    name: '이영희',
    email: 'lee.younghee@example.com',
    team: '개발팀',
    isEmployed: true,
  });

  const savedMembers = await memberRepository.save([member1, member2]);
  console.log('멤버 2명 생성 완료');

  // 2. 스프린트 1개 생성
  const sprint = sprintRepository.create({
    title: 'Sprint 1 - 2026년 1월',
    description: '첫 번째 스프린트입니다.',
    startDate: new Date('2026-01-06'),
    endDate: new Date('2026-01-20'),
    status: SprintStatusEnum.ACTIVE,
  });

  const savedSprint = await sprintRepository.save(sprint);
  console.log('스프린트 1개 생성 완료');

  // 3. 백로그 업무 3개 생성
  const backlogTasks = [
    {
      title: '백로그 업무 1 - 사용자 인증 기능',
      description: '로그인 및 회원가입 기능 구현',
      status: TaskStatusEnum.PLANNED,
      priority: TaskPriorityEnum.HIGH,
      estimatedHours: 8,
      isBackLog: true,
      sprint: null,
      member: null,
    },
    {
      title: '백로그 업무 2 - 대시보드 UI',
      description: '메인 대시보드 UI 개발',
      status: TaskStatusEnum.PLANNED,
      priority: TaskPriorityEnum.MEDIUM,
      estimatedHours: 12,
      isBackLog: true,
      sprint: null,
      member: null,
    },
    {
      title: '백로그 업무 3 - 데이터 내보내기',
      description: 'CSV 형식으로 데이터 내보내기 기능',
      status: TaskStatusEnum.PLANNED,
      priority: TaskPriorityEnum.LOW,
      estimatedHours: 6,
      isBackLog: true,
      sprint: null,
      member: null,
    },
  ];

  const backlogTaskEntities = backlogTasks.map((task) =>
    taskRepository.create(task),
  );
  await taskRepository.save(backlogTaskEntities);
  console.log('백로그 업무 3개 생성 완료');

  // 4. 스프린트 하위 업무 3개 생성
  const sprintTasks = [
    {
      title: '스프린트 업무 1 - API 엔드포인트',
      description: '스프린트 관리 API 구현',
      status: TaskStatusEnum.ACTIVE,
      priority: TaskPriorityEnum.HIGH,
      estimatedHours: 16,
      isBackLog: false,
      sprint: savedSprint,
      member: savedMembers[0],
    },
    {
      title: '스프린트 업무 2 - 데이터베이스 설계',
      description: '데이터베이스 스키마 및 마이그레이션',
      status: TaskStatusEnum.ACTIVE,
      priority: TaskPriorityEnum.HIGH,
      estimatedHours: 12,
      isBackLog: false,
      sprint: savedSprint,
      member: savedMembers[1],
    },
    {
      title: '스프린트 업무 3 - 테스트 작성',
      description: '단위 테스트 및 E2E 테스트 작성',
      status: TaskStatusEnum.ACTIVE,
      priority: TaskPriorityEnum.MEDIUM,
      estimatedHours: 10,
      isBackLog: false,
      sprint: savedSprint,
      member: savedMembers[0],
    },
  ];

  const sprintTaskEntities = sprintTasks.map((task) =>
    taskRepository.create(task),
  );
  const savedSprintTasks = await taskRepository.save(sprintTaskEntities);
  console.log('스프린트 하위 업무 3개 생성 완료');

  // 5. 각 업무별 업무일지 2개씩 생성
  const worklogs = [];

  for (const task of savedSprintTasks) {
    const worklog1 = worklogRepository.create({
      title: `${task.title} - 진행 중 (1)`,
      contents: '기본 기능 개발 진행 중',
      workTime: 4,
      workDate: new Date('2026-01-06'),
      task,
      member: task.member,
    });

    const worklog2 = worklogRepository.create({
      title: `${task.title} - 진행 중 (2)`,
      contents: '테스트 및 수정',
      workTime: 3,
      workDate: new Date('2026-01-07'),
      task,
      member: task.member,
    });

    worklogs.push(worklog1, worklog2);
  }

  await worklogRepository.save(worklogs);
}
