import { DataSource, EntityManager } from 'typeorm';

/**
 * 트랜잭션 헬퍼 : QueryRunner를 사용해 트랜잭션을 안전하게 실행하고 소스코드의 중복을 줄임
 *
 * @example
 * await runInTransaction(this.dataSource, async (manager) => {
 *   const repo = manager.getRepository(Entity);
 *   return repo.save(data);
 * });
 */
export async function runInTransaction<T>(
  dataSource: DataSource,
  work: (manager: EntityManager) => Promise<T>,
): Promise<T> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const result = await work(queryRunner.manager);
    await queryRunner.commitTransaction();
    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
