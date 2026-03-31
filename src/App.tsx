import React, { useState, useEffect } from 'react'
import { Box, Button, Container, Heading, Text, Input, VStack, HStack, Table, Thead, Tbody, Tr, Th, Td, Alert, AlertIcon, AlertTitle, AlertDescription, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useDisclosure, FormControl, FormLabel, Switch, Spinner } from '@chakra-ui/react'
import * as XLSX from 'xlsx'

interface EmailServerConfig {
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  useTls: boolean
}

interface DataRow {
  [key: string]: string | number | undefined
  email?: string
}

const API_BASE_URL = 'http://172.16.1.32:5004'

const App: React.FC = () => {
  const [, setFile] = useState<File | null>(null)
  const [data, setData] = useState<DataRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [emailColumn, setEmailColumn] = useState<string>('email')
  const [emailServerConfig, setEmailServerConfig] = useState<EmailServerConfig>({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    useTls: true
  })
  const [isConfigSaved, setIsConfigSaved] = useState<boolean>(false)
  const [sendStatus, setSendStatus] = useState<{ [key: number]: 'success' | 'error' | null }>({})
  const [sendMessage, setSendMessage] = useState<{ [key: number]: string }>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { isOpen, onOpen, onClose } = useDisclosure()

  // 从本地存储加载配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('emailServerConfig')
    if (savedConfig) {
      setEmailServerConfig(JSON.parse(savedConfig))
      setIsConfigSaved(true)
    }
  }, [])

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      processFile(selectedFile)
    }
  }

  // 处理文件内容
  const processFile = (file: File) => {
    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // 首先获取所有单元格数据
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
        const rawData: any[][] = []
        
        // 遍历所有行
        for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
          const row: any[] = []
          // 遍历所有列
          for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum })
            const cell = worksheet[cellAddress]
            row.push(cell ? cell.v : null)
          }
          // 过滤掉空行
          const nonEmptyCells = row.filter(cell => cell !== null && cell !== undefined && cell !== '')
          if (nonEmptyCells.length > 0) {
            rawData.push(row)
          }
        }
        
        // 确保有数据
        if (rawData.length > 0) {
          // 第一行作为表头
          const headers = rawData[0].map((header, index) => {
            if (header === null || header === undefined || header === '') {
              return `列${index + 1}`
            }
            return header
          })
          
          // 剩余行作为数据
          const data: DataRow[] = []
          for (let i = 1; i < rawData.length; i++) {
            const rowData: DataRow = {}
            const row = rawData[i]
            headers.forEach((header, index) => {
              rowData[header] = row[index] !== null && row[index] !== undefined ? row[index] : ''
            })
            data.push(rowData)
          }
          
          setHeaders(headers)
          setData(data)
          
          // 自动检测邮箱列
          let newEmailColumn = 'email'
          const emailColumns = headers.filter(header => 
            header.toLowerCase().includes('email') || header.toLowerCase().includes('邮箱')
          )
          if (emailColumns.length > 0) {
            newEmailColumn = emailColumns[0]
          } else {
            // 如果没有找到邮箱列，默认使用第一列
            newEmailColumn = headers[0]
          }
          setEmailColumn(newEmailColumn)
          
          // 将数据发送到后端
          const formData = new FormData()
          formData.append('email_column', newEmailColumn)
          formData.append('data', JSON.stringify(data))
          
          fetch(`${API_BASE_URL}/upload_data`, {
            method: 'POST',
            body: formData
          })
          .then(response => response.json())
          .then(data => {
            console.log('数据上传成功:', data)
          })
          .catch(error => {
            console.error('数据上传失败:', error)
          })
        }
      } catch (error) {
        console.error('Error processing file:', error)
      } finally {
        setIsLoading(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  // 保存邮件服务器配置
  const handleSaveConfig = () => {
    localStorage.setItem('emailServerConfig', JSON.stringify(emailServerConfig))
    setIsConfigSaved(true)
    onClose()
  }

  // 测试邮件发送
  const handleTestEmail = async () => {
    if (!isConfigSaved) {
      alert('请先配置邮件服务器')
      return
    }

    try {
      const formData = new FormData()
      formData.append('recipient_email', 'xuanjueming@foreverht.com')
      formData.append('subject', '测试邮件发送功能')
      formData.append('smtp_server', emailServerConfig.smtpHost)
      formData.append('smtp_port', emailServerConfig.smtpPort.toString())
      formData.append('sender_email', emailServerConfig.smtpUsername)
      formData.append('sender_password', emailServerConfig.smtpPassword)

      const response = await fetch(`${API_BASE_URL}/send_test_email`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        alert('测试邮件发送成功！请检查邮箱')
      } else {
        alert(`测试邮件发送失败: ${data.message}`)
      }
    } catch (error) {
      console.error('测试邮件发送失败:', error)
      alert('测试邮件发送失败，请检查控制台错误信息')
    }
  }

  // 发送邮件
  const handleSendEmail = async (rowIndex: number) => {
    const row = data[rowIndex]
    const email = row[emailColumn] as string
    
    if (!email) {
      setSendStatus(prev => ({ ...prev, [rowIndex]: 'error' }))
      setSendMessage(prev => ({ ...prev, [rowIndex]: '邮箱地址不存在' }))
      setTimeout(() => {
        setSendStatus(prev => ({ ...prev, [rowIndex]: null }))
        setSendMessage(prev => ({ ...prev, [rowIndex]: '' }))
      }, 3000)
      return
    }

    if (!isConfigSaved) {
      setSendStatus(prev => ({ ...prev, [rowIndex]: 'error' }))
      setSendMessage(prev => ({ ...prev, [rowIndex]: '请先配置邮件服务器' }))
      setTimeout(() => {
        setSendStatus(prev => ({ ...prev, [rowIndex]: null }))
        setSendMessage(prev => ({ ...prev, [rowIndex]: '' }))
      }, 3000)
      return
    }

    setSendStatus(prev => ({ ...prev, [rowIndex]: null }))
    setSendMessage(prev => ({ ...prev, [rowIndex]: '发送中...' }))

    try {
      // 实际调用后端API发送邮件
      const formData = new FormData()
      formData.append('row_index', rowIndex.toString())
      formData.append('subject', '您的工资单')
      formData.append('smtp_server', emailServerConfig.smtpHost)
      formData.append('smtp_port', emailServerConfig.smtpPort.toString())
      formData.append('sender_email', emailServerConfig.smtpUsername)
      formData.append('sender_password', emailServerConfig.smtpPassword)

      const response = await fetch(`${API_BASE_URL}/send_single`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setSendStatus(prev => ({ ...prev, [rowIndex]: 'success' }))
        setSendMessage(prev => ({ ...prev, [rowIndex]: '发送成功' }))
      } else {
        setSendStatus(prev => ({ ...prev, [rowIndex]: 'error' }))
        setSendMessage(prev => ({ ...prev, [rowIndex]: data.message || '发送失败' }))
      }
    } catch (error) {
      console.error('发送邮件失败:', error)
      setSendStatus(prev => ({ ...prev, [rowIndex]: 'error' }))
      setSendMessage(prev => ({ ...prev, [rowIndex]: '发送失败' }))
    } finally {
      setTimeout(() => {
        setSendStatus(prev => ({ ...prev, [rowIndex]: null }))
        setSendMessage(prev => ({ ...prev, [rowIndex]: '' }))
      }, 3000)
    }
  }

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* 标题 */}
          <VStack spacing={2} align="center">
            <Heading as="h1" size="2xl" color="primary.600">
              邮件发送系统
            </Heading>
            <Text color="gray.600">
              上传Excel文件，预览数据并发送邮件
            </Text>
          </VStack>

          {/* 首页测试邮件发送按钮 */}
          <HStack justify="center">
            <Button colorScheme="green" size="lg" onClick={handleTestEmail}>
              测试邮件发送
            </Button>
          </HStack>

          {/* 配置按钮和测试按钮 */}
          <HStack justify="flex-end">
            <Button colorScheme="primary" onClick={onOpen}>
              配置邮件服务器
            </Button>
            <Button colorScheme="green" onClick={handleTestEmail}>
              测试邮件发送
            </Button>
          </HStack>

          {/* 配置模态框 */}
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>邮件服务器配置</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>SMTP服务器</FormLabel>
                    <Input
                      value={emailServerConfig.smtpHost}
                      onChange={(e) => setEmailServerConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>SMTP端口</FormLabel>
                    <Input
                      type="number"
                      value={emailServerConfig.smtpPort}
                      onChange={(e) => setEmailServerConfig(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 587 }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>用户名</FormLabel>
                    <Input
                      value={emailServerConfig.smtpUsername}
                      onChange={(e) => setEmailServerConfig(prev => ({ ...prev, smtpUsername: e.target.value }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>密码</FormLabel>
                    <Input
                      type="password"
                      value={emailServerConfig.smtpPassword}
                      onChange={(e) => setEmailServerConfig(prev => ({ ...prev, smtpPassword: e.target.value }))}
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <Switch
                      isChecked={emailServerConfig.useTls}
                      onChange={(e) => setEmailServerConfig(prev => ({ ...prev, useTls: e.target.checked }))}
                    />
                    <FormLabel ml={2}>使用TLS</FormLabel>
                  </FormControl>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="primary" onClick={handleSaveConfig}>
                  保存配置
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* 配置状态 */}
          {isConfigSaved && (
            <Alert status="success" mb={4}>
              <AlertIcon />
              <AlertTitle>邮件服务器配置已保存</AlertTitle>
            </Alert>
          )}

          {/* 文件上传 */}
          <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="lg" mb={4} color="gray.800">
              上传Excel文件
            </Heading>
            <VStack spacing={4} align="stretch">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
              <Text color="gray.500" fontSize="sm">
                支持 .xlsx 和 .xls 格式的Excel文件
              </Text>
            </VStack>
          </Box>

          {/* 邮箱列选择 */}
          {headers.length > 0 && (
            <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
              <Heading as="h2" size="lg" mb={4} color="gray.800">
                邮箱列设置
              </Heading>
              <FormControl>
                <FormLabel>选择邮箱列</FormLabel>
                <select
                  value={emailColumn}
                  onChange={(e) => {
                    const newEmailColumn = e.target.value
                    setEmailColumn(newEmailColumn)
                    
                    // 当邮箱列变化时，重新将数据发送到后端
                    if (data.length > 0) {
                      const formData = new FormData()
                      formData.append('email_column', newEmailColumn)
                      formData.append('data', JSON.stringify(data))
                      
                      fetch(`${API_BASE_URL}/upload_data`, {
                        method: 'POST',
                        body: formData
                      })
                      .then(response => response.json())
                      .then(data => {
                        console.log('邮箱列更新成功:', data)
                      })
                      .catch(error => {
                        console.error('邮箱列更新失败:', error)
                      })
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {headers.map(header => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </FormControl>
            </Box>
          )}

          {/* 数据预览 */}
          {data.length > 0 && (
            <Box bg="white" p={6} borderRadius="lg" boxShadow="md" overflowX-auto>
              <Heading as="h2" size="lg" mb={4} color="gray.800">
                数据预览
              </Heading>
              {isLoading ? (
                <VStack spacing={4} align="center" py={8}>
                  <Spinner size="lg" />
                  <Text>处理文件中...</Text>
                </VStack>
              ) : (
                <Table variant="simple">
                  <Thead bg="gray.50">
                    <Tr>
                      {headers.map(header => (
                        <Th key={header}>{header}</Th>
                      ))}
                      <Th>操作</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.map((row, index) => (
                      <Tr key={index}>
                        {headers.map(header => (
                          <Td key={header}>{row[header] || ''}</Td>
                        ))}
                        <Td>
                          <HStack spacing={2}>
                            <Button
                              colorScheme="primary"
                              size="sm"
                              onClick={() => handleSendEmail(index)}
                              isLoading={sendMessage[index] === '发送中...'}
                            >
                              发送邮件
                            </Button>
                            {sendStatus[index] === 'success' && (
                              <Alert status="success" fontSize="xs" py={1}>
                                <AlertIcon fontSize="sm" />
                                <AlertDescription>{sendMessage[index]}</AlertDescription>
                              </Alert>
                            )}
                            {sendStatus[index] === 'error' && (
                              <Alert status="error" fontSize="xs" py={1}>
                                <AlertIcon fontSize="sm" />
                                <AlertDescription>{sendMessage[index]}</AlertDescription>
                              </Alert>
                            )}
                            {sendMessage[index] === '发送中...' && (
                              <Alert status="info" fontSize="xs" py={1}>
                                <AlertIcon fontSize="sm" />
                                <AlertDescription>{sendMessage[index]}</AlertDescription>
                              </Alert>
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  )
}

export default App
