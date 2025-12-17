import { __ } from '../utils/i18n';
import { yesNo, list } from './formatters';

export const comparisonSchema = [
  {
    id: 'type_of_care',
    label: __('Type of care', 'zorg'),
    accessor: p => p.type_of_care
  },
  {
    id: 'indication_type',
    label: __('Indication type', 'zorg'),
    accessor: p => p.indication_type
  },
  {
    id: 'organization_type',
    label: __('Organization type', 'zorg'),
    accessor: p => p.organization_type
  },
  {
    id: 'religion',
    label: __('Religion', 'zorg'),
    accessor: p => p.religion
  },
  {
    id: 'hkz',
    label: __('HKZ certified', 'zorg'),
    accessor: p => p.has_hkz,
    format: yesNo
  },
  {
    id: 'age_groups',
    label: __('Target age groups', 'zorg'),
    accessor: p => p.target_age_groups,
    format: list
  },
  {
    id: 'genders',
    label: __('Target genders', 'zorg'),
    accessor: p => p.target_genders,
    format: list
  },
  {
    id: 'reimbursements',
    label: __('Reimbursements', 'zorg'),
    accessor: p => p.reimbursements.map(r => r.type),
    format: list
  },
  {
    id: 'rating',
    label: __('Client rating', 'zorg'),
    accessor: p => p.reviews,
    format: r => `${r.overall} / 5 (${r.count})`
  }
];
