import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Brain,
  Folder,
  FolderOpen,
  FileText,
  FileJson,
  FileCode,
  File,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  Search,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Modal,
  useToast,
  Spinner,
} from '../components/ui';
import {
  getFileTree,
  getFileContent,
  saveFileContent,
  createFile,
  deleteFile,
  renameFile,
  getLanguageFromExtension,
  formatFileSize,
  type FileNode,
} from '../services/files';

// 文件图标组件
function FileIcon({ node }: { node: FileNode }) {
  if (node.type === 'directory') {
    return node.children && node.children.length > 0 ? (
      <FolderOpen className="w-4 h-4 text-[var(--color-primary)]" />
    ) : (
      <Folder className="w-4 h-4 text-[var(--color-text-secondary)]" />
    );
  }

  const ext = node.extension;
  if (ext === '.md' || ext === '.markdown') {
    return <FileText className="w-4 h-4 text-blue-500" />;
  }
  if (ext === '.json') {
    return <FileJson className="w-4 h-4 text-yellow-500" />;
  }
  if (ext === '.js' || ext === '.ts' || ext === '.tsx' || ext === '.jsx' || ext === '.py') {
    return <FileCode className="w-4 h-4 text-green-500" />;
  }
  return <File className="w-4 h-4 text-[var(--color-text-secondary)]" />;
}

// 树节点组件
function TreeNode({
  node,
  level,
  selectedPath,
  expandedPaths,
  onSelect,
  onToggle,
  onContextMenu,
}: {
  node: FileNode;
  level: number;
  selectedPath: string | null;
  expandedPaths: Set<string>;
  onSelect: (node: FileNode) => void;
  onToggle: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
}) {
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer transition-colors rounded-md mx-1 ${
          isSelected
            ? 'bg-[var(--color-primary)] text-white'
            : 'hover:bg-[var(--color-primary-light)] text-[var(--color-text-primary)]'
        }`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => {
          if (node.type === 'directory') {
            onToggle(node.path);
          }
          onSelect(node);
        }}
        onContextMenu={(e) => onContextMenu(e, node)}
      >
        {node.type === 'directory' && (
          <span className="w-4 h-4 flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </span>
        )}
        {node.type === 'file' && <span className="w-4" />}
        <FileIcon node={node} />
        <span className="text-sm truncate flex-1 ml-1">{node.name}</span>
      </div>
      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
              onSelect={onSelect}
              onToggle={onToggle}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Memory() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Agent 选择
  const [selectedAgent, setSelectedAgent] = useState<string>('');

  // 文件树状态
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // 编辑器状态
  const [fileContent, setFileContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // 搜索状态
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileNode | null;
  } | null>(null);

  // 模态框状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'directory'>('file');
  const [createName, setCreateName] = useState('');
  const [createParentPath, setCreateParentPath] = useState('');

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameNode, setRenameNode] = useState<FileNode | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteNode, setDeleteNode] = useState<FileNode | null>(null);

  // 获取文件树
  const {
    data: fileTree,
    isLoading: isTreeLoading,
    error: treeError,
  } = useQuery({
    queryKey: ['fileTree', selectedAgent],
    queryFn: () => getFileTree(selectedAgent || undefined),
  });

  // 获取文件内容
  const {
    data: fileData,
    isLoading: isFileLoading,
    error: fileError,
  } = useQuery({
    queryKey: ['fileContent', selectedPath, selectedAgent],
    queryFn: () =>
      selectedPath ? getFileContent(selectedPath, selectedAgent || undefined) : null,
    enabled: !!selectedPath,
  });

  // 初始化文件内容
  useEffect(() => {
    if (fileData) {
      setFileContent(fileData.content);
      setOriginalContent(fileData.content);
      setIsDirty(false);
    }
  }, [fileData]);

  // 保存文件 mutation
  const saveMutation = useMutation({
    mutationFn: ({ path, content }: { path: string; content: string }) =>
      saveFileContent(path, content, selectedAgent || undefined),
    onSuccess: () => {
      setOriginalContent(fileContent);
      setIsDirty(false);
      showToast(t('memory.saveSuccess'), 'success');
      queryClient.invalidateQueries({ queryKey: ['fileContent', selectedPath, selectedAgent] });
    },
    onError: (error) => {
      showToast(error.message || t('memory.saveError'), 'error');
    },
  });

  // 创建文件 mutation
  const createMutation = useMutation({
    mutationFn: ({ path, type }: { path: string; type: 'file' | 'directory' }) =>
      createFile(path, type, selectedAgent || undefined),
    onSuccess: () => {
      showToast(t('memory.createSuccess'), 'success');
      queryClient.invalidateQueries({ queryKey: ['fileTree', selectedAgent] });
      setShowCreateModal(false);
      setCreateName('');
    },
    onError: (error) => {
      showToast(error.message || t('memory.createError'), 'error');
    },
  });

  // 删除文件 mutation
  const deleteMutation = useMutation({
    mutationFn: (path: string) => deleteFile(path, selectedAgent || undefined),
    onSuccess: () => {
      showToast(t('memory.deleteSuccess'), 'success');
      queryClient.invalidateQueries({ queryKey: ['fileTree', selectedAgent] });
      if (selectedPath === deleteNode?.path) {
        setSelectedPath(null);
        setFileContent('');
        setOriginalContent('');
      }
      setShowDeleteModal(false);
      setDeleteNode(null);
    },
    onError: (error) => {
      showToast(error.message || t('memory.deleteError'), 'error');
    },
  });

  // 重命名文件 mutation
  const renameMutation = useMutation({
    mutationFn: ({ oldPath, newPath }: { oldPath: string; newPath: string }) =>
      renameFile(oldPath, newPath, selectedAgent || undefined),
    onSuccess: () => {
      showToast(t('memory.renameSuccess'), 'success');
      queryClient.invalidateQueries({ queryKey: ['fileTree', selectedAgent] });
      setShowRenameModal(false);
      setRenameNode(null);
      setRenameValue('');
    },
    onError: (error) => {
      showToast(error.message || t('memory.renameError'), 'error');
    },
  });

  // 处理文件选择
  const handleSelect = useCallback((node: FileNode) => {
    setSelectedPath(node.path);
    if (node.type === 'file') {
      // 文件内容会通过 useQuery 自动加载
    }
  }, []);

  // 处理文件夹展开/折叠
  const handleToggle = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // 处理编辑器内容变化
  const handleEditorChange = useCallback((value: string | undefined) => {
    setFileContent(value || '');
    setIsDirty(value !== originalContent);
  }, [originalContent]);

  // 处理保存
  const handleSave = useCallback(() => {
    if (selectedPath) {
      saveMutation.mutate({ path: selectedPath, content: fileContent });
    }
  }, [selectedPath, fileContent, saveMutation]);

  // 处理撤销
  const handleRevert = useCallback(() => {
    setFileContent(originalContent);
    setIsDirty(false);
  }, [originalContent]);

  // 处理右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
    });
  }, []);

  // 关闭右键菜单
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // 获取文件语言
  const fileLanguage = selectedPath
    ? getLanguageFromExtension(selectedPath.match(/\.[^.]+$/)?.[0])
    : 'plaintext';

  // 获取当前文件节点
  const currentFileNode = useCallback((): FileNode | null => {
    if (!fileTree || !selectedPath) return null;

    const findNode = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.path === selectedPath) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findNode(fileTree);
  }, [fileTree, selectedPath]);

  const currentNode = currentFileNode();

  // Agent 选项（模拟）
  const agentOptions = [
    { value: '', label: t('memory.globalMemory') },
    { value: 'assistant', label: 'Assistant Agent' },
    { value: 'coder', label: 'Coder Agent' },
    { value: 'researcher', label: 'Researcher Agent' },
  ];

  // 快捷入口
  const quickAccess = [
    { name: t('memory.workingMemory'), path: 'working', icon: Brain },
    { name: t('memory.archivedMemory'), path: 'archive', icon: Folder },
    { name: t('memory.identityFiles'), path: 'identity', icon: FileText },
  ];

  return (
    <div className="space-y-4 h-[calc(100vh-120px)]">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[var(--color-primary-light)]">
            <Brain className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {t('page.memory.title')}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {t('page.memory.description')}
            </p>
          </div>
        </div>

        <Select
          value={selectedAgent}
          onChange={setSelectedAgent}
          options={agentOptions}
          className="w-48"
        />
      </div>

      {/* 主内容区 */}
      <div className="flex gap-4 h-[calc(100%-80px)]">
        {/* 左侧文件树 */}
        <div className="w-72 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          {/* 工具栏 */}
          <div className="flex items-center justify-between p-3 border-b border-[var(--color-border)]">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {t('memory.fileTree')}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  setCreateType('file');
                  setCreateParentPath('');
                  setShowCreateModal(true);
                }}
              >
                <FilePlus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  setCreateType('directory');
                  setCreateParentPath('');
                  setShowCreateModal(true);
                }}
              >
                <FolderPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 快捷入口 */}
          <div className="p-2 border-b border-[var(--color-border)]">
            {quickAccess.map((item) => (
              <button
                key={item.path}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)] rounded-lg transition-colors"
                onClick={() => {
                  // 展开对应目录
                  handleToggle(item.path);
                }}
              >
                <item.icon className="w-4 h-4 text-[var(--color-primary)]" />
                {item.name}
              </button>
            ))}
          </div>

          {/* 文件树 */}
          <div className="flex-1 overflow-y-auto py-2">
            {isTreeLoading ? (
              <div className="flex items-center justify-center h-32">
                <Spinner size="sm" />
              </div>
            ) : treeError ? (
              <div className="p-4 text-center text-[var(--color-danger)] text-sm">
                <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                {t('memory.loadError')}
              </div>
            ) : fileTree && fileTree.length > 0 ? (
              fileTree.map((node) => (
                <TreeNode
                  key={node.path}
                  node={node}
                  level={0}
                  selectedPath={selectedPath}
                  expandedPaths={expandedPaths}
                  onSelect={handleSelect}
                  onToggle={handleToggle}
                  onContextMenu={handleContextMenu}
                />
              ))
            ) : (
              <div className="p-4 text-center text-[var(--color-text-secondary)] text-sm">
                {t('memory.emptyDirectory')}
              </div>
            )}
          </div>
        </div>

        {/* 右侧编辑器 */}
        <div className="flex-1 flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          {selectedPath && currentNode?.type === 'file' ? (
            <>
              {/* 编辑器头部 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {selectedPath}
                  </span>
                  {isDirty && (
                    <span className="text-xs text-[var(--color-warning)]">
                      {t('memory.unsaved')}
                    </span>
                  )}
                  {currentNode?.size !== undefined && (
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {formatFileSize(currentNode.size)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSearch(!showSearch)}
                    className={showSearch ? 'bg-[var(--color-primary-light)]' : ''}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRevert}
                    disabled={!isDirty}
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t('common.revert')}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    loading={saveMutation.isPending}
                    disabled={!isDirty}
                  >
                    <Save className="w-4 h-4" />
                    {t('common.save')}
                  </Button>
                </div>
              </div>

              {/* 搜索框 */}
              {showSearch && (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-background)]">
                  <Search className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <input
                    type="text"
                    placeholder={t('memory.searchInFile')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editorRef.current) {
                        const action = editorRef.current.getAction('actions.find');
                        if (action) {
                          action.run();
                        }
                      }
                    }}
                  />
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowSearch(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* 编辑器 */}
              <div className="flex-1">
                {isFileLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Spinner size="md" />
                  </div>
                ) : fileError ? (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--color-danger)]">
                    <AlertCircle className="w-10 h-10 mb-3" />
                    <p>{t('memory.fileLoadError')}</p>
                  </div>
                ) : (
                  <Editor
                    height="100%"
                    language={fileLanguage}
                    value={fileContent}
                    onChange={handleEditorChange}
                    onMount={(editor) => {
                      editorRef.current = editor;
                    }}
                    options={{
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      folding: true,
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      formatOnPaste: true,
                      formatOnType: true,
                      readOnly: false,
                    }}
                    theme="vs"
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-secondary)]">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                {t('memory.selectFile')}
              </p>
              <p className="text-sm max-w-md text-center">
                {t('memory.selectFileDesc')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu && contextMenu.node && (
        <div
          className="fixed z-50 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg py-1 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.node.type === 'directory' && (
            <>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)]"
                onClick={() => {
                  setCreateType('file');
                  setCreateParentPath(contextMenu.node!.path);
                  setShowCreateModal(true);
                  setContextMenu(null);
                }}
              >
                <FilePlus className="w-4 h-4" />
                {t('memory.newFile')}
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)]"
                onClick={() => {
                  setCreateType('directory');
                  setCreateParentPath(contextMenu.node!.path);
                  setShowCreateModal(true);
                  setContextMenu(null);
                }}
              >
                <FolderPlus className="w-4 h-4" />
                {t('memory.newFolder')}
              </button>
            </>
          )}
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)]"
            onClick={() => {
              setRenameNode(contextMenu.node);
              setRenameValue(contextMenu.node!.name);
              setShowRenameModal(true);
              setContextMenu(null);
            }}
          >
            <Edit3 className="w-4 h-4" />
            {t('memory.rename')}
          </button>
          <div className="border-t border-[var(--color-border)] my-1" />
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-red-50"
            onClick={() => {
              setDeleteNode(contextMenu.node);
              setShowDeleteModal(true);
              setContextMenu(null);
            }}
          >
            <Trash2 className="w-4 h-4" />
            {t('memory.delete')}
          </button>
        </div>
      )}

      {/* 创建文件/文件夹模态框 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateName('');
        }}
        title={createType === 'file' ? t('memory.newFile') : t('memory.newFolder')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const fullPath = createParentPath
                  ? `${createParentPath}/${createName}`
                  : createName;
                createMutation.mutate({ path: fullPath, type: createType });
              }}
              loading={createMutation.isPending}
              disabled={!createName}
            >
              <Check className="w-4 h-4" />
              {t('common.create')}
            </Button>
          </>
        }
      >
        <Input
          label={createType === 'file' ? t('memory.fileName') : t('memory.folderName')}
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
          placeholder={createType === 'file' ? 'example.md' : 'new-folder'}
          autoFocus
        />
      </Modal>

      {/* 重命名模态框 */}
      <Modal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setRenameNode(null);
          setRenameValue('');
        }}
        title={t('memory.rename')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowRenameModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (renameNode) {
                  const parentPath = renameNode.path.substring(
                    0,
                    renameNode.path.lastIndexOf('/')
                  );
                  const newPath = parentPath
                    ? `${parentPath}/${renameValue}`
                    : renameValue;
                  renameMutation.mutate({ oldPath: renameNode.path, newPath });
                }
              }}
              loading={renameMutation.isPending}
              disabled={!renameValue || renameValue === renameNode?.name}
            >
              <Check className="w-4 h-4" />
              {t('common.save')}
            </Button>
          </>
        }
      >
        <Input
          label={t('memory.newName')}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder={renameNode?.name}
          autoFocus
        />
      </Modal>

      {/* 删除确认模态框 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteNode(null);
        }}
        title={t('memory.confirmDelete')}
        description={
          deleteNode?.type === 'directory'
            ? t('memory.deleteFolderConfirm')
            : t('memory.deleteFileConfirm')
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteNode) {
                  deleteMutation.mutate(deleteNode.path);
                }
              }}
              loading={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-[var(--color-text-primary)]">
          <span className="font-medium">{deleteNode?.name}</span>
        </p>
      </Modal>
    </div>
  );
}
