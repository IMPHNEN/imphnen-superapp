import type { TPermission } from '@app/permissions';
import type { FC, ReactElement } from 'react';
import type { TPermissionItem } from '../../_hooks/use-roles';

const RESOURCE_SEPARATOR = ':';

type TPermissionGroup = {
  resource: string;
  items: TPermissionItem[];
};

const groupByResource = (
  permissions: readonly TPermissionItem[]
): TPermissionGroup[] => {
  const groups = new Map<string, TPermissionItem[]>();
  for (const permission of permissions) {
    const [resource] = permission.key.split(RESOURCE_SEPARATOR);
    groups.set(resource, [...(groups.get(resource) ?? []), permission]);
  }
  return [...groups.entries()].map(([resource, items]) => ({
    resource,
    items,
  }));
};

type TPermissionPickerProps = {
  permissions: readonly TPermissionItem[];
  value: readonly TPermission[];
  onChange: (value: TPermission[]) => void;
  disabled?: boolean;
};

export const PermissionPicker: FC<TPermissionPickerProps> = ({
  permissions,
  value,
  onChange,
  disabled = false,
}): ReactElement => {
  const selected = new Set(value);
  const toggle = (keys: readonly TPermission[], checked: boolean): void => {
    const next = new Set(selected);
    for (const key of keys) {
      if (checked) next.add(key);
      else next.delete(key);
    }
    onChange([...next]);
  };

  return (
    <div className="flex flex-col gap-4 items-start overflow-auto">
      <span className="text-p3 font-medium text-neutral-800 sticky left-0">
        Permissions
      </span>
      <div className="flex gap-x-6 gap-y-2 overflow-x-auto flex-wrap">
        {groupByResource(permissions).map(({ resource, items }) => {
          const keys = items.map((item) => item.key);
          const allChecked = keys.every((key) => selected.has(key));
          const groupId = `permission-${resource}-all`;
          return (
            <div
              key={resource}
              className="flex flex-col gap-4 select-none text-label2 font-medium text-neutral-900"
            >
              <span className="text-nowrap text-label1">{resource}</span>
              <div className="flex gap-[8px] items-center">
                <input
                  type="checkbox"
                  id={groupId}
                  className="rounded"
                  checked={allChecked}
                  disabled={disabled}
                  onChange={(e) => toggle(keys, e.target.checked)}
                />
                <label htmlFor={groupId} className="text-nowrap">
                  Check All
                </label>
              </div>
              <hr className="border-blue-200" />
              <div className="flex flex-col items-start gap-4 mb-4">
                {items.map((item) => {
                  const id = `permission-${item.key}`;
                  return (
                    <div key={item.key} className="flex gap-[8px] items-center">
                      <input
                        type="checkbox"
                        id={id}
                        checked={selected.has(item.key)}
                        disabled={disabled}
                        onChange={(e) => toggle([item.key], e.target.checked)}
                      />
                      <label htmlFor={id} title={item.key}>
                        {item.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
