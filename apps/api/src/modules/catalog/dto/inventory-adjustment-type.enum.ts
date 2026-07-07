import { registerEnumType } from '@nestjs/graphql'

export enum InventoryAdjustmentType {
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE',
  SET = 'SET',
}

registerEnumType(InventoryAdjustmentType, {
  name: 'InventoryAdjustmentType',
  description: 'How AdjustInventoryInput.quantity is applied to the current quantityOnHand.',
})
