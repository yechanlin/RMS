import React, { useState } from 'react';
import { Paper, Title, List, Collapse, Group, Button } from '@mantine/core';

export default function InfoPanel() {
  const [opened, setOpened] = useState(true);

  return (
    <Paper
      radius="lg"
      p="md"
      withBorder
      className="backdrop-blur-md bg-gray-800/90 border-white/20 shadow-2xl transition-all duration-300 hover:shadow-3xl hover:bg-gray-700/90"
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        zIndex: 20,
        backgroundColor: 'var(--mantine-color-dark-6)',
        maxWidth: '320px',
      }}
    >
      <Group justify="space-between" mb="sm">
        <Title
          order={3}
          size="h4"
          className="text-white font-bold tracking-wide"
          style={{
            color: 'white',
          }}
        >
          Quick Guide
        </Title>
        
        <Button
          variant="subtle"
          color="blue"
          size="xs"
          onClick={() => setOpened(!opened)}
          className="text-gray-300 hover:text-white transition-colors duration-200"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '0.75rem',
            height: 'auto',
            padding: '2px 6px'
          }}
        >
          {opened ? 'Hide' : 'Show'}
        </Button>
      </Group>
      
      <Collapse in={opened} transitionDuration={0}>
        <div className="space-y-4">
          {/* Getting Started Section */}
          <div>
            <Title order={5} className="text-blue-300 font-semibold mb-2 text-xs">
              Getting Started
            </Title>
            <List
              size="sm"
              spacing="xs"
              className="space-y-1"
              styles={{
                itemWrapper: { color: 'var(--mantine-color-gray-3)', paddingLeft: 0 },
                item: { color: 'var(--mantine-color-gray-3)', paddingLeft: 0 },
                root: { paddingLeft: 0, marginLeft: 0 },
              }}
            >
              <List.Item className="text-gray-300 hover:text-white transition-colors duration-200" style={{ fontSize: '0.8rem' }}>
                • Click the <strong>base node</strong> to upload your CV
              </List.Item>
              <List.Item className="text-gray-300 hover:text-white transition-colors duration-200" style={{ fontSize: '0.8rem' }}>
                • Type company names in the text box and press <strong>Enter</strong> (remember, no duplicates)
              </List.Item>
            </List>
          </div>

          {/* Adding Roles Section */}
          <div>
            <Title order={5} className="text-purple-300 font-semibold mb-2 text-xs">
              Adding Roles
            </Title>
            <List
              size="sm"
              spacing="xs"
              className="space-y-1"
              styles={{
                itemWrapper: { color: 'var(--mantine-color-gray-3)', paddingLeft: 0 },
                item: { color: 'var(--mantine-color-gray-3)', paddingLeft: 0 },
                root: { paddingLeft: 0, marginLeft: 0 },
              }}
            >
              <List.Item className="text-gray-300 hover:text-white transition-colors duration-200" style={{ fontSize: '0.8rem' }}>
                • Click on any <strong>company node</strong> to add roles
              </List.Item>
              <List.Item className="text-gray-300 hover:text-white transition-colors duration-200" style={{ fontSize: '0.8rem' }}>
                • Paste job description and press <strong>✓ Submit</strong>
              </List.Item>
            </List>
          </div>

          {/* Managing Nodes Section */}
          <div>
            <Title order={5} className="text-orange-300 font-semibold mb-2 text-xs">
              Managing Nodes
            </Title>
            <List
              size="sm"
              spacing="xs"
              className="space-y-1"
              styles={{
                itemWrapper: { color: 'var(--mantine-color-gray-3)', paddingLeft: 0 },
                item: { color: 'var(--mantine-color-gray-3)', paddingLeft: 0 },
                root: { paddingLeft: 0, marginLeft: 0 },
              }}
            >
              <List.Item className="text-gray-300 hover:text-white transition-colors duration-200" style={{ fontSize: '0.8rem' }}>
                • <strong>Double-click</strong> any node to edit its name
              </List.Item>
              <List.Item className="text-gray-300 hover:text-white transition-colors duration-200" style={{ fontSize: '0.8rem' }}>
                • <strong>Ctrl+Click</strong> to select multiple nodes of the same type
              </List.Item>
              <List.Item className="text-gray-300 hover:text-white transition-colors duration-200" style={{ fontSize: '0.8rem' }}>
                • Select multiple <span className="text-green-400">companies</span>, <span className="text-indigo-400">roles</span>, or <span className="text-orange-400">resumes</span> at once
              </List.Item>
              <List.Item className="text-gray-300 hover:text-white transition-colors duration-200" style={{ fontSize: '0.8rem' }}>
                • <strong>Select All</strong> picks nodes within the same parent (e.g., all roles in one company)
              </List.Item>
              <List.Item className="text-gray-300 hover:text-white transition-colors duration-200" style={{ fontSize: '0.8rem' }}>
                • Use <strong>Control Panel</strong> to delete selected nodes
              </List.Item>
            </List>
          </div>

          {/* Resume Generation Section */}
          <div>
            <Title order={5} className="text-green-300 font-semibold mb-2 text-xs">
              Resume Generation
            </Title>
            <List
              size="sm"
              spacing="xs"
              className="space-y-1"
              styles={{
                itemWrapper: { color: 'var(--mantine-color-gray-3)', paddingLeft: 0 },
                item: { color: 'var(--mantine-color-gray-3)', paddingLeft: 0 },
                root: { paddingLeft: 0, marginLeft: 0 },
              }}
            >
              <List.Item className="text-gray-300 hover:text-white transition-colors duration-200" style={{ fontSize: '0.8rem' }}>
                • Click on <strong>role nodes</strong> to generate tailored resumes
              </List.Item>
              <List.Item className="text-gray-300 hover:text-white transition-colors duration-200" style={{ fontSize: '0.8rem' }}>
                • Not happy? Click <strong>"Create new version"</strong>
              </List.Item>
            </List>
          </div>

          {/* Quick Tips */}
          <div className="pt-2 border-t border-gray-600/50">
            <Title order={6} className="text-yellow-300 font-semibold mb-2 text-xs">
              Pro Tips
            </Title>
            <List
              size="sm"
              spacing="xs"
              className="space-y-1"
              styles={{
                itemWrapper: { color: 'var(--mantine-color-gray-4)', paddingLeft: 0 },
                item: { color: 'var(--mantine-color-gray-4)', paddingLeft: 0 },
                root: { paddingLeft: 0, marginLeft: 0 },
              }}
            >
              <List.Item className="text-gray-400" style={{ fontSize: '0.75rem' }}>
                • Use descriptive role names like "Senior SWE" or "ML Engineer"
              </List.Item>
              <List.Item className="text-gray-400" style={{ fontSize: '0.75rem' }}>
                • Keep job descriptions detailed for better resume tailoring
              </List.Item>
            </List>
          </div>

          <div className="pt-2 border-t border-gray-600/50">
            <Title order={6} className="text-indigo-400 font-semibold mb-2 text-xs">
              What is a CV?
            </Title>
            <List
              size="sm"
              spacing="xs"
              className="space-y-1"
              styles={{
                itemWrapper: { color: 'var(--mantine-color-gray-4)', paddingLeft: 0 },
                item: { color: 'var(--mantine-color-gray-4)', paddingLeft: 0 },
                root: { paddingLeft: 0, marginLeft: 0 },
              }}
            >
              <List.Item className="text-gray-400" style={{ fontSize: '0.75rem' }}>
                <strong>CV (Curriculum Vitae)</strong> = Your complete professional story. It contains <strong>all</strong> your work experience, education, skills, projects. Think of it as your "master document" (2-5+ pages)
              </List.Item>
            </List>
          </div>
        </div>
      </Collapse>
    </Paper>
  );
}