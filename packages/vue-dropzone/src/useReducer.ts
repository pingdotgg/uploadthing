// copy from mya-ake/vue-use-reducer
// [link](https://github.com/mya-ake/vue-use-reducer/blob/master/src/type.ts)

import { reactive, toRaw } from 'vue'

type Unwrap<T> = T extends { [k: string]: infer U }
  ? U
  : T extends (infer U)[]
  ? U
  : T;
type isPrimitive<T> = T extends Unwrap<T> ? T : never;

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends isPrimitive<T[P]>
    ? T[P]
    : DeepReadonly<T[P]>;
};

type State = Record<string, unknown>;
type Action = {
  type: string;
};
export type ReducerState = State
export type ReducerAction = Action

export type Dispatch<A extends Action> = (action: A) => void;
export type Reducer<S extends State, A extends Action> = (
  state: S,
  action: A,
) => S;
export type ReturnValue<S extends State, A extends Action> = [
  DeepReadonly<S>,
  Dispatch<A>,
];

export const useReducer = <S extends State, A extends Action>(
  reducer: Reducer<S, A>,
  initialState: S,
  initialAction?: A,
): ReturnValue<S, A> => {
  const state = reactive(initialState)
  const dispatch: Dispatch<A> = (action) => {
    const newState = reducer(toRaw(state) as S, action)
    Object.keys(newState).forEach((key: keyof S) => {
      (state as S)[key] = newState[key]
    })
  }

  if (initialAction != null) {
    dispatch(initialAction)
  }
  return [state as DeepReadonly<S>, dispatch]
}
