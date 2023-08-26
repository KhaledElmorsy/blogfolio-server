import type { KeyOfValueType } from '@/util/types';

export default function fieldValuesMatch<
  T extends Record<string, unknown>,
  O extends Record<string, unknown>,
  Key extends (string | number) & O[OKey],
  OKey extends KeyOfValueType<O, Key>,
  TKey extends KeyOfValueType<T, Key>,
>({
  inputData,
  inputKey,
  targetData,
  targetKey,
  fieldMap,
}: {
  inputData: O[];
  inputKey: OKey & (O[OKey] extends Key ? OKey : never);
  targetData: T[];
  targetKey: TKey & (T[TKey] extends Key ? TKey : never);
  fieldMap: { [inputField in keyof Partial<O>]: keyof T };
}): boolean {
  if (targetData.length < inputData.length) {
    throw new Error(
      `Input data set cannot be larger than the target data. Input: ${inputData.length}, Target: ${targetData.length}`,
    );
  }

  {
    const targetKeyType = typeof targetData[0][targetKey];
    const inputKeyType = typeof inputData[0][inputKey];
    if (targetKeyType !== inputKeyType) {
      throw new Error(
        `Reference key types don't match. Input: ${inputKeyType}, Target: ${targetKeyType}`,
      );
    }
  }

  const inputMap = inputData.reduce(
    (acc, obj) => ({ ...acc, [obj[inputKey] as Key]: obj }),
    {} as Record<Key, O>,
  );

  const targetMap = targetData.reduce(
    (acc, obj) => ({ ...acc, [obj[targetKey] as Key]: obj }),
    {} as Record<Key, T>,
  );

  {
    const unmatchedKeys = Object.keys(inputMap).filter(
      (iKey) => !Object.hasOwn(targetMap, iKey),
    );
    if (unmatchedKeys.length) {
      throw new Error(
        `Can't find the following input keys in the target data: ${JSON.stringify(
          unmatchedKeys,
        )}`,
      );
    }
  }

  const inputFields = Object.keys(fieldMap);

  return Object.entries<O>(inputMap).reduce(
    (matched, [key, inputObj]) =>
      matched
      && inputFields.reduce((acc, field) => {
        const targetField = fieldMap[field];
        const targetValue = targetMap[key as Key][targetField];
        return acc && targetValue === inputObj[field];
      }, true),
    true,
  );
}
