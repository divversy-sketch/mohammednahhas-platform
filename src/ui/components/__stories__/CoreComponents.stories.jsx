import React from 'react';
import { Button, Card, SkeletonBlock, EmptyState } from '@ui';

export default {
  title: 'UI/Core Components',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Core UI examples kept as Storybook-ready documentation for the shared component layer.'
      }
    }
  }
};

export const Buttons = () => (
  <div className="flex flex-wrap gap-3 p-4">
    <Button>Primary action</Button>
    <Button variant="soft">Soft action</Button>
    <Button variant="student">Student action</Button>
  </div>
);

export const Cards = () => (
  <Card className="max-w-sm p-5">
    <h3 className="text-lg font-bold">Reusable Card</h3>
    <p className="mt-2 text-sm text-slate-600">This card should be reused instead of creating one-off card markup.</p>
  </Card>
);

export const States = () => (
  <div className="grid gap-4 p-4">
    <SkeletonBlock rows={3} />
    <EmptyState title="No data yet" description="Use this state for empty tables, lists, and dashboards." />
  </div>
);
