import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolUseCard } from '../../webview/components/Tools/ToolUseCard';
import { mockVscodeApi } from '../../tests/setup';

describe('ToolUseCard', () => {
  it('renders diff preview for Edit tool', () => {
    render(
      <ToolUseCard
        toolName="Edit"
        input={{
          file_path: '/tmp/test.txt',
          old_string: 'foo',
          new_string: 'bar',
        }}
        fileContentBefore={'foo\nbaz'}
        defaultCollapsed={false}
      />
    );

    expect(screen.getByText('Diff Preview')).toBeInTheDocument();
    const summary = screen.getByText(/Summary:/);
    expect(summary.textContent).toContain('+1');
    expect(summary.textContent).toContain('-1');
    expect(screen.getByText('foo')).toBeInTheDocument();
    expect(screen.getByText('bar')).toBeInTheDocument();
  });

  it('sends openDiff message when Diff button is clicked', () => {
    render(
      <ToolUseCard
        toolName="Edit"
        input={{
          file_path: '/tmp/test.txt',
          old_string: 'foo',
          new_string: 'bar',
        }}
        fileContentBefore={'foo\nbaz'}
        defaultCollapsed={true}
      />
    );

    const diffButton = screen.getByRole('button', { name: 'Diff' });
    fireEvent.click(diffButton);

    expect(mockVscodeApi.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'openDiff',
        filePath: '/tmp/test.txt',
      })
    );
  });
});
