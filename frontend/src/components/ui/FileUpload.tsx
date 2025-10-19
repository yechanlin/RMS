import React from 'react';
import { Dropzone, DropzoneProps, FileWithPath } from '@mantine/dropzone';
import { Group, Text, rem } from '@mantine/core';

interface FileUploadProps extends Omit<DropzoneProps, 'children' | 'onDrop'> {
  onFileSelect: (file: FileWithPath) => void;
  accept?: string[];
  title?: string;
  description?: string;
  loading?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  title = 'Upload file',
  description = 'Drag file here or click to select',
  loading = false,
  ...props
}) => {
  return (
    <Dropzone
      onDrop={(files) => {
        if (files.length > 0) {
          onFileSelect(files[0]);
        }
      }}
      accept={accept}
      multiple={false}
      loading={loading}
      {...props}
    >
      <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
        <Dropzone.Accept>
          <div style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-blue-6)' }}>
            📤
          </div>
        </Dropzone.Accept>
        <Dropzone.Reject>
          <div style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}>
            ❌
          </div>
        </Dropzone.Reject>
        <Dropzone.Idle>
          <div style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-dimmed)' }}>
            📁
          </div>
        </Dropzone.Idle>

        <div>
          <Text size="xl" inline>
            {title}
          </Text>
          <Text size="sm" c="dimmed" inline mt={7}>
            {description}
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
};